import {Grid, GridConfiguration} from "../common/dataspace/Grid";
import {Processor} from "../common/dataspace/Processor";
import {Server} from "../common/dataspace/Server";
import {getConfiguration} from "../common/dataspace/Configuration";

start()
    .then()
    .catch(e => console.log('error starting storage server: ', e));

async function start() {
    const configuration = await getGridConfiguration();
    const server = new Server(
        '0.0.0.0',
        process.env.PORT as any || 8889,
        new Processor(
            new Grid(
                configuration.cx,
                configuration.cy,
                configuration.cz,
                configuration.edge,
                configuration.step,
                configuration.range
            )));
    server.listen();

    process.on('exit', function () {
        server.close();
    });
}

async function getGridConfiguration(): Promise<GridConfiguration> {
    if (process.env.WS_URL && process.env.CLUSTER_CONFIGURATION_URL) {
        const webUrl = process.env.WS_URL;
        const clusterConfiguration = await getConfiguration(process.env.CLUSTER_CONFIGURATION_URL);
        clusterConfiguration.servers.forEach(serverInfo => {
           if (serverInfo.url.trim().toLocaleLowerCase() === webUrl.trim().toLocaleLowerCase()) {
               const gridConfiguration = new GridConfiguration(
                   serverInfo.x,
                   serverInfo.y,
                   serverInfo.z,
                   clusterConfiguration.edge,
                   clusterConfiguration.step,
                   clusterConfiguration.range
               );
               console.log("cluster '" + clusterConfiguration.name + "' server: " + serverInfo.url + " configuration: \n" + JSON.stringify(gridConfiguration, null, 2));
               return gridConfiguration;
           }
           throw new Error("No matching server " + webUrl + " in loaded configuration " + JSON.stringify(clusterConfiguration));
        });
    }
    return new GridConfiguration(
        process.env.GRID_CX as any || 0,
        process.env.GRID_CY as any || 0,
        process.env.GRID_CZ as any || 0,
        process.env.GRID_EDGE as any || 1000,
        process.env.GRID_STEP  as any || 100,
        process.env.GRID_RANGE as any || 200
    );
}