import {Grid} from "./processor/Grid";
import {Processor} from "./processor/Processor";
import {DataSpaceServer} from "./server/DataSpaceServer";
import {
    getProcessorConfiguration,
    getStorageConfiguration,
    getClusterConfiguration, IdTokenIssuer,
    ProcessorConfiguration, StorageConfiguration, SanitizerConfig
} from "../common/dataspace/Configuration";
import {Sanitizer} from "../common/dataspace/Sanitizer";
import {ServerAvatarClient} from "./server/ServerAvatarClient";
import {FileSystemRepository} from "./storage/FileSystemRepository";
import {StorageApi} from "./api/StorageApi";
import {loadConfiguration} from "./util/configuration";
import {S3Repository} from "./storage/S3Repository";
import {Repository} from "./storage/Repository";
const config = require('config');

start().then().catch(e => console.log('dataspace server - startup error: ', e));

async function start() {

    // Load configuration.
    const gridConfiguration = await loadConfiguration();

    console.log("Loaded configuration: " + JSON.stringify(gridConfiguration, null, ' '));

    const sanitizerConfiguration = gridConfiguration[0];
    const processorConfiguration = gridConfiguration[1];
    const storageConfiguration = gridConfiguration[2];
    const idTokenIssuers = gridConfiguration[3];

    // Construct components.
    const sanitizer = new Sanitizer(sanitizerConfiguration.allowedElements, sanitizerConfiguration.allowedAttributes, sanitizerConfiguration.allowedAttributeValueRegex);
    const processor = processorConfiguration ? newProcessor(processorConfiguration, sanitizer) : undefined;
    const storageApi = storageConfiguration ? await newStorageApi(storageConfiguration, sanitizer) : undefined;

    if (processor) {
        console.log("dataspace server - started processor at public URL: " + processorConfiguration!!.url);
    }
    if (storageApi) {
        console.log("dataspace server - started storage at public URL: " + storageConfiguration!!.url);
    }

    // Construct server.
    const server = new DataSpaceServer(
        '0.0.0.0',
        config.get("Server.port"),
        processor,
        storageApi,
        idTokenIssuers);

    // Start listening.
    await server.startup();

    // Start server avatar client.
    if (process.env.WS_URL && process.env.CLUSTER_CONFIGURATION_URL) {
        const serverAvatarClient = new ServerAvatarClient(process.env.CLUSTER_CONFIGURATION_URL);
        await serverAvatarClient.start();
    }

    // Add exit hook
    process.on('exit', async () => {
        await server.close();
    });
}

function newProcessor(serverConfiguration: ProcessorConfiguration, sanitizer: Sanitizer) {
    return new Processor(
        new Grid(
            serverConfiguration.cx,
            serverConfiguration.cy,
            serverConfiguration.cz,
            serverConfiguration.edge,
            serverConfiguration.step,
            serverConfiguration.range
        ), sanitizer
    );
}

async function newRepository(): Promise<Repository> {
    const storageType = config.get('Storage.type');
    if (storageType == "S3") {
        console.log("dataspace server - storage repository type is S3.");
        const bucket = config.get('AWS.publicBucket');
        const repository = new S3Repository(bucket);
        await repository.startup();
        return repository;
    } else {
        console.log("dataspace server - storage repository type is file system.");
        const repository = new FileSystemRepository();
        await repository.startup();
        return repository;
    }
}

async function newStorageApi(storageConfiguration: StorageConfiguration, sanitizer: Sanitizer) {
    const repository = await newRepository();
    const storageRestService = new StorageApi(repository, sanitizer, storageConfiguration.serverNames);
    await storageRestService.startup();
    return storageRestService;
}

