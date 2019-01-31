require('isomorphic-fetch');

export class ClusterConfiguration {
    name: string = "";
    description: string = "";
    edge: number = 1000;
    step: number = 100;
    range: number = 200;
    maxSpaces: number = 10;
    processorUrl: string = "";
    storageUrl: string = "";
    cdnUrl: string = "";
    spaces: Array<string> = new Array<string>();
    sanitizer: SanitizerConfiguration = new SanitizerConfiguration();
    regions: Array<RegionConfiguration> = new Array<RegionConfiguration>();
    idTokenIssuers: Array<IdTokenIssuer> = new Array<IdTokenIssuer>();
}

export class RegionConfiguration {
    region: string = "";
    processorUrl: string = "";
    storageUrl: string = "";
    cdnUrl: string = "";
    spaces: Array<string> = new Array<string>();
    maxSpaces: number = 0;
    edge: number = 0;
    step: number = 0;
    range: number = 0;
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

export class SanitizerConfiguration {
    allowedElements: string = "";
    allowedAttributes: string = "";
    allowedAttributeValueRegex: string = "";
}

export class StorageConfiguration {
    url: string;
    regions: Array<string>;
    spaces: Array<string> = new Array<string>();
    maxSpaces: number;

    constructor(url: string, regions: Array<string>, spaces: Array<string>, maxSpaces: number) {
        this.url = url;
        this.regions = regions;
        this.spaces = spaces;
        this.maxSpaces = maxSpaces;

    }
}

export class IdTokenIssuer {
    issuer: string = "";
    publicKey: string = "";

    constructor(issuer: string, publicKey: string) {
        this.issuer = issuer;
        this.publicKey = publicKey;
    }
}

export async function getClusterConfiguration(url: string): Promise<ClusterConfiguration> {
    return (await fetchConfiguration(url))!!;
}

export async function fetchConfiguration(url: string): Promise<ClusterConfiguration | undefined> {
    if (!url || url.length == 0) {
        return undefined;
    }
    const response = await fetch(url);
    if (response.status >= 400) {
        throw new Error("Bad response from server");
    }
    const responseText = await (response.text());
    const clusterConfiguration = JSON.parse(responseText) as ClusterConfiguration;

    clusterConfiguration.regions.forEach((processor) => {
        processor.region = processor.region && processor.region.length > 0 ? processor.region : processor.x + "-" + processor.y + "-" + processor.z;
        processor.processorUrl = processor.processorUrl && processor.processorUrl.length > 0 ? processor.processorUrl : clusterConfiguration.processorUrl;
        processor.storageUrl = processor.storageUrl && processor.storageUrl.length > 0 ? processor.storageUrl : clusterConfiguration.storageUrl;
        processor.cdnUrl = processor.cdnUrl && processor.cdnUrl.length > 0 ? processor.cdnUrl : clusterConfiguration.cdnUrl;
        processor.spaces = processor.spaces && processor.spaces.length > 0 ? processor.spaces : clusterConfiguration.spaces;
        processor.maxSpaces = processor.maxSpaces ? processor.maxSpaces : clusterConfiguration.maxSpaces;
        processor.edge = processor.edge ? processor.edge : clusterConfiguration.edge;
        processor.step = processor.step ? processor.step : clusterConfiguration.step;
        processor.range = processor.range ? processor.range : clusterConfiguration.range;
    });

    return clusterConfiguration;
}

/**
 * Gets regions processor is responsible for.
 * @param clusterConfiguration the cluster configuration.
 * @param processorUrl the processor URL
 */
export function getRegionConfigurations(clusterConfiguration: ClusterConfiguration, processorUrl: string) : Map<string, RegionConfiguration> {
    const normalizedServerUrl = processorUrl.trim().toLocaleLowerCase();
    const processorConfigs = new Map<string, RegionConfiguration>();
    for (let processor of clusterConfiguration.regions) {
        const normalizedServerUrlCandidate = processor.processorUrl.trim().toLowerCase();
        if (normalizedServerUrl == normalizedServerUrlCandidate) {
            processorConfigs.set(processor.region, processor);
        }
    };
    return processorConfigs;
}

/**
 * Gets storage configuration.
 * @param clusterConfiguration the cluster configuration
 * @param storageUrl the storage URL
 */
export function getStorageConfiguration(clusterConfiguration: ClusterConfiguration, storageUrl: string) {
    const matchingServerNames = clusterConfiguration.regions.filter(s => {
        const processorStorageUrl = s.storageUrl && s.storageUrl.length > 0 ? s.storageUrl : clusterConfiguration.storageUrl;
        return processorStorageUrl.trim().toLocaleLowerCase() == storageUrl.trim().toLocaleLowerCase()
    }).map(s => s.region);
    return new StorageConfiguration(storageUrl, matchingServerNames, clusterConfiguration.spaces, clusterConfiguration.maxSpaces);
}

export function findItTokenIssuerConfiguration(clusterConfiguration: ClusterConfiguration, issuer: string) : IdTokenIssuer | null {
    for (let idTokenIssuer of clusterConfiguration.idTokenIssuers) {
        if (idTokenIssuer.issuer === issuer) {
            return idTokenIssuer;
        }
    }
    return null;
}

