require('isomorphic-fetch');

export class ServerConfig {
    url: string = "";
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

export class ServerConfiguration {
    cx: number;
    cy: number;
    cz: number;
    edge: number;
    step: number;
    range: number;
    allowedElements: string;
    allowedAttributes: string;
    allowedAttributeValueRegex: string;


    constructor(cx: number, cy: number, cz: number, edge: number, step: number, range: number, allowedElements: string, allowedAttributes: string, attributeValueRegex: string) {
        this.cx = cx;
        this.cy = cy;
        this.cz = cz;
        this.edge = edge;
        this.step = step;
        this.range = range;
        this.allowedElements = allowedElements;
        this.allowedAttributes = allowedAttributes;
        this.allowedAttributeValueRegex = attributeValueRegex;
    }
}

export function findGridConfiguration(clusterConfiguration: ClusterConfiguration, serverUrl: String) : ServerConfiguration {
    for (let serverInfo of clusterConfiguration.servers) {
        const normalizedServerUrl = serverInfo.url.trim().toLowerCase();
        if (normalizedServerUrl === serverUrl) {
            const gridConfiguration = new ServerConfiguration(
                serverInfo.x,
                serverInfo.y,
                serverInfo.z,
                clusterConfiguration.edge,
                clusterConfiguration.step,
                clusterConfiguration.range,
                clusterConfiguration.sanitizer.allowedElements,
                clusterConfiguration.sanitizer.allowedAttributes,
                clusterConfiguration.sanitizer.allowedAttributeValueRegex
            );
            console.log("cluster '" + clusterConfiguration.name + "' server: " + serverInfo.url + " configuration: \n" + JSON.stringify(gridConfiguration, null, 2));
            return gridConfiguration;
        }
    };
    throw new Error("No matching server " + serverUrl + " in loaded configuration " + JSON.stringify(clusterConfiguration));
}

export function findItTokenIssuerConfiguration(clusterConfiguration: ClusterConfiguration, issuer: string) : IdTokenIssuer | null {
    for (let idTokenIssuer of clusterConfiguration.idTokenIssuers) {
        if (idTokenIssuer.issuer === issuer) {
            return idTokenIssuer;
        }
    }
    return null;
}