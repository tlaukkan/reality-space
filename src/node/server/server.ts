import {ClusterConfiguration, getStorageConfiguration} from "../../common/reality/Configuration";
import {RealityServer} from "./RealityServer";
import {Sanitizer} from "../../common/reality/Sanitizer";
import {ProcessorRequestManager} from "../processor/ProcessorRequestManager";
import {StorageRequestManager} from "../storage/StorageRequestManager";
import {Repository} from "../storage/Repository";
import {S3Repository} from "../storage/S3Repository";
import {FileSystemRepository} from "../storage/FileSystemRepository";
const config = require('config');

export function newRealityServer(clusterConfiguration: ClusterConfiguration, processorUrl: string, storageUrl: string, storageType: string, listenIp: string, listenPort: number): RealityServer {
    const sanitizer = new Sanitizer(clusterConfiguration.sanitizer.allowedElements, clusterConfiguration.sanitizer.allowedAttributes, clusterConfiguration.sanitizer.allowedAttributeValueRegex);

    const processorManager = processorUrl ? newProcessorRequestManager(processorUrl, clusterConfiguration, sanitizer) : undefined;
    const storageManager = storageUrl ? newStorageRequestManager(storageUrl, storageType, clusterConfiguration, sanitizer) : undefined;

    // Construct server.
    const server = new RealityServer(
        listenIp,
        listenPort,
        processorManager,
        storageManager,
        clusterConfiguration.idTokenIssuers);
    return server;
}

function newProcessorRequestManager(processorUrl: string, clusterConfiguration: ClusterConfiguration, sanitizer: Sanitizer): ProcessorRequestManager {
    return new ProcessorRequestManager(processorUrl, clusterConfiguration, sanitizer);
}

function newStorageRequestManager(storageUrl: string, storageType: string, clusterConfiguration: ClusterConfiguration, sanitizer: Sanitizer): StorageRequestManager {
    const storageConfiguration = getStorageConfiguration(clusterConfiguration, storageUrl);
    const repository = newRepository(storageType);
    return new StorageRequestManager(repository, sanitizer, storageConfiguration.regions, storageConfiguration.spaces, storageConfiguration.maxSpaces);
}

function newRepository(storageType: string): Repository {
    if (storageType == "s3") {
        console.log("reality server - storage repository type is S3.");
        const bucket = config.get('AWS.publicBucket');
        const repository = new S3Repository(bucket);
        return repository;
    } else {
        console.log("reality server - storage repository type is file system.");
        const repository = new FileSystemRepository();
        return repository;
    }
}
