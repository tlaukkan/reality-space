import {GridConfiguration} from "./Grid";
require('isomorphic-fetch');

export class ServerInfo{
    url: string = "";
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

export class ClusterConfiguration {

    name: string = "";
    description: string = "";
    edge: number = 1000;
    step: number = 100;
    range: number = 200;

    servers: Array<ServerInfo> = new Array<ServerInfo>();

}

export async function getClusterConfiguration(url: string): Promise<ClusterConfiguration> {
    return await fetchConfiguration(url);
}

export async function fetchConfiguration(url: string): Promise<ClusterConfiguration> {
    const response = await fetch(url);
    if (response.status >= 400) {
        throw new Error("Bad response from server");
    }
    const responseText = await (response.text());
    return JSON.parse(responseText) as ClusterConfiguration;
}

export function findGridConfiguration(clusterConfiguration: ClusterConfiguration, serverUrl: String) : GridConfiguration {
    for (let serverInfo of clusterConfiguration.servers) {
        const normalizedServerUrl = serverInfo.url.trim().toLowerCase();
        if (normalizedServerUrl === serverUrl) {
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
    };
    throw new Error("No matching server " + serverUrl + " in loaded configuration " + JSON.stringify(clusterConfiguration));
}