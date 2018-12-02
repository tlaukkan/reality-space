import {Grid} from "../common/dataspace/Grid";
import {Processor} from "../common/dataspace/Processor";
import {Server} from "./server/Server";
import {
    ClusterConfiguration,
    findGridConfiguration,
    getClusterConfiguration, IdTokenIssuer,
    ServerConfiguration
} from "../common/dataspace/Configuration";
import {Sanitizer} from "../common/dataspace/Sanitizer";
import {ServerAvatarClient} from "./server/ServerAvatarClient";
import {Storage} from "./storage/Storage";
import {FileSystemRepository} from "./storage/repository/FileSystemRepository";
import {StorageApi} from "./api/StorageApi";

start()
    .then()
    .catch(e => console.log('error starting storage server: ', e));

async function start() {
    const gridConfiguration = await getGridConfiguration();
    const configuration = gridConfiguration[0];
    const idTokenIssuers = gridConfiguration[1];
    const sanitizer = new Sanitizer(configuration.allowedElements,
        configuration.allowedAttributes,
        configuration.allowedAttributeValueRegex);

    const processor = new Processor(
        new Grid(
            configuration.cx,
            configuration.cy,
            configuration.cz,
            configuration.edge,
            configuration.step,
            configuration.range
        ),sanitizer
    );

    const repository = new FileSystemRepository();
    const storageRestService = new StorageApi(repository, sanitizer);
    await storageRestService.startup();

    const server = new Server(
        '0.0.0.0',
        process.env.PORT as any || 8889,
        processor,
        storageRestService,
        idTokenIssuers);

    server.listen();

    if (process.env.WS_URL && process.env.CLUSTER_CONFIGURATION_URL) {
        const serverAvatarClient = new ServerAvatarClient(process.env.CLUSTER_CONFIGURATION_URL);
        await serverAvatarClient.start();
    }

    process.on('exit', function () {
        server.close();
    });
}

async function getGridConfiguration(): Promise<[ServerConfiguration, Array<IdTokenIssuer>]> {
    if (process.env.WS_URL && process.env.CLUSTER_CONFIGURATION_URL) {
        const wsUrl = process.env.WS_URL;
        const clusterConfiguration = await getClusterConfiguration(process.env.CLUSTER_CONFIGURATION_URL);
        return [findGridConfiguration(clusterConfiguration, wsUrl.trim().toLowerCase()),
            clusterConfiguration.idTokenIssuers];
    }
    return [new ServerConfiguration(
        process.env.GRID_CX as any || 0,
        process.env.GRID_CY as any || 0,
        process.env.GRID_CZ as any || 0,
        process.env.GRID_EDGE as any || 1000,
        process.env.GRID_STEP  as any || 100,
        process.env.GRID_RANGE as any || 200,
        process.env.ALLOWED_ELEMENTS as any || 'a-box',
        process.env.ALLOWED_ATTRIBUTES  as any || 'scale',
        process.env.ALLOWED_ATTRIBUTE_VALUE_REGEX as any || '[^\\w\\s:;]',
    ),[]];
}