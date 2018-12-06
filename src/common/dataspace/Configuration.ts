require('isomorphic-fetch');

export class ServerConfig {
    name: string = "";
    url: string = "";
    apiUrl: string = "";
    assetUrl: string = "";
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

export class SanitizerConfig {
    allowedElements: string = "";
    allowedAttributes: string = "";
    allowedAttributeValueRegex: string = "";
}

export class IdTokenIssuer {
    issuer: string = "";
    publicKey: string = "";


    constructor(issuer: string, publicKey: string) {
        this.issuer = issuer;
        this.publicKey = publicKey;
    }
}

export class ClusterConfiguration {
    name: string = "";
    description: string = "";
    edge: number = 1000;
    step: number = 100;
    range: number = 200;
    sanitizer: SanitizerConfig = new SanitizerConfig();
    servers: Array<ServerConfig> = new Array<ServerConfig>();
    idTokenIssuers: Array<IdTokenIssuer> = new Array<IdTokenIssuer>();
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

export class ProcessorConfiguration {
    name: string;
    url: string;
    cx: number;
    cy: number;
    cz: number;
    edge: number;
    step: number;
    range: number;

    constructor(name: string, url: string, cx: number, cy: number, cz: number, edge: number, step: number, range: number) {
        this.name = name;
        this.url = url;
        this.cx = cx;
        this.cy = cy;
        this.cz = cz;
        this.edge = edge;
        this.step = step;
        this.range = range;
    }
}

export class StorageConfiguration {
    url: string;
    serverNames: Array<string>;

    constructor(url: string, serverNames: Array<string>) {
        this.url = url;
        this.serverNames = serverNames;
    }
}

export function getProcessorConfiguration(clusterConfiguration: ClusterConfiguration, serverUrl: string) : ProcessorConfiguration {
    for (let serverInfo of clusterConfiguration.servers) {
        const normalizedServerUrl = serverInfo.url.trim().toLowerCase();
        if (normalizedServerUrl === serverUrl.trim().toLowerCase()) {
            const gridConfiguration = new ProcessorConfiguration(
                serverInfo.name,
                serverUrl,
                serverInfo.x,
                serverInfo.y,
                serverInfo.z,
                clusterConfiguration.edge,
                clusterConfiguration.step,
                clusterConfiguration.range
            );
            return gridConfiguration;
        }
    };
    throw new Error("No matching server " + serverUrl + " in loaded configuration " + JSON.stringify(clusterConfiguration));
}

export function getStorageConfiguration(clusterConfiguration: ClusterConfiguration, storageApiUrl: string) {
    const matchingServerNames = clusterConfiguration.servers.filter(s => s.apiUrl.toLocaleLowerCase() === storageApiUrl.trim().toLocaleLowerCase()).map(s => s.name);
    return new StorageConfiguration(storageApiUrl, matchingServerNames);
}

export function findItTokenIssuerConfiguration(clusterConfiguration: ClusterConfiguration, issuer: string) : IdTokenIssuer | null {
    for (let idTokenIssuer of clusterConfiguration.idTokenIssuers) {
        if (idTokenIssuer.issuer === issuer) {
            return idTokenIssuer;
        }
    }
    return null;
}

