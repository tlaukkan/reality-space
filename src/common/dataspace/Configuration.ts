import * as fs from "fs";
import {readFile} from "fs";
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

export async function getConfiguration(url: string): Promise<ClusterConfiguration> {
    if (url.startsWith("http")) {
        return await fetchConfiguration(url);
    } else {
        return await loadConfiguration(url);
    }
}

export async function fetchConfiguration(url: string): Promise<ClusterConfiguration> {
    const response = await fetch(url);
    if (response.status >= 400) {
        throw new Error("Bad response from server");
    }
    const responseText = await (response.text());
    return JSON.parse(responseText) as ClusterConfiguration;
}

export function loadConfiguration(path: string): Promise<ClusterConfiguration> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', function (err, contents) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(contents) as ClusterConfiguration)
            }
        });
    });
}
