require('isomorphic-fetch');

export class ProcessorConfig {
    name: string = "";
    processorUrl: string = "";
    storageUrl: string = "";
    cdnUrl: string = "";
    dimensions: Array<string> = new Array<string>();
    maxDimensions: number = 0;
    edge: number = 0;
    step: number = 0;
    range: number = 0;
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
    maxDimensions: number = 10;
    storageUrl: string = "";
    cdnUrl: string = "";
    dimensions: Array<string> = new Array<string>();
    sanitizer: SanitizerConfig = new SanitizerConfig();
    processors: Array<ProcessorConfig> = new Array<ProcessorConfig>();
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
    const clusterConfiguration = JSON.parse(responseText) as ClusterConfiguration;

    clusterConfiguration.processors.forEach((processor) => {
        processor.storageUrl = processor.storageUrl && processor.storageUrl.length > 0 ? processor.storageUrl : clusterConfiguration.storageUrl;
        processor.cdnUrl = processor.cdnUrl && processor.cdnUrl.length > 0 ? processor.cdnUrl : clusterConfiguration.cdnUrl;
        processor.dimensions = processor.dimensions && processor.dimensions.length > 0 ? processor.dimensions : clusterConfiguration.dimensions;
        processor.maxDimensions = processor.maxDimensions ? processor.maxDimensions : clusterConfiguration.maxDimensions;
        processor.edge = processor.edge ? processor.edge : clusterConfiguration.edge;
        processor.step = processor.step ? processor.step : clusterConfiguration.step;
        processor.range = processor.range ? processor.range : clusterConfiguration.range;
    });

    return clusterConfiguration;
}

export class ProcessorConfiguration {
    name: string;
    processorUrl: string;
    dimensions: Array<string> = new Array<string>();
    maxDimensions: number;
    cx: number;
    cy: number;
    cz: number;
    edge: number;
    step: number;
    range: number;

    constructor(name: string, processorUrl: string, dimensions: Array<string>, maxDimensions: number, cx: number, cy: number, cz: number, edge: number, step: number, range: number) {
        this.name = name;
        this.processorUrl = processorUrl;
        this.dimensions = dimensions;
        this.maxDimensions = maxDimensions;
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
    processorNames: Array<string>;
    dimensions: Array<string> = new Array<string>();
    maxDimensions: number;

    constructor(url: string, processorNames: Array<string>, dimensions: Array<string>, maxDimensions: number) {
        this.url = url;
        this.processorNames = processorNames;
        this.dimensions = dimensions;
        this.maxDimensions = maxDimensions;

    }
}

export function getProcessorConfiguration(clusterConfiguration: ClusterConfiguration, processorUrl: string) : ProcessorConfiguration {
    const normalizedServerUrl = processorUrl.trim().toLocaleLowerCase();
    for (let processor of clusterConfiguration.processors) {
        const normalizedServerUrlCandidate = processor.processorUrl.trim().toLowerCase();
        if (normalizedServerUrl == normalizedServerUrlCandidate) {
            const processorConfiguration = new ProcessorConfiguration(
                processor.name,
                processorUrl,
                processor.dimensions,
                processor.maxDimensions,
                processor.x,
                processor.y,
                processor.z,
                processor.edge,
                processor.step,
                processor.range
            );
            return processorConfiguration;
        }
    };
    throw new Error("No matching server " + processorUrl + " in loaded configuration " + JSON.stringify(clusterConfiguration));
}

export function getStorageConfiguration(clusterConfiguration: ClusterConfiguration, storageUrl: string) {
    console.log("Processors: " + JSON.stringify(clusterConfiguration.processors));
    console.log("Storage URL: '" + storageUrl.trim().toLocaleLowerCase() + "'");
    const matchingServerNames = clusterConfiguration.processors.filter(s => {
        const processorStorageUrl = s.storageUrl && s.storageUrl.length > 0 ? s.storageUrl : clusterConfiguration.storageUrl;
        return processorStorageUrl.trim().toLocaleLowerCase() == storageUrl.trim().toLocaleLowerCase()
    }).map(s => s.name);
    return new StorageConfiguration(storageUrl, matchingServerNames, clusterConfiguration.dimensions, clusterConfiguration.maxDimensions);
}

export function findItTokenIssuerConfiguration(clusterConfiguration: ClusterConfiguration, issuer: string) : IdTokenIssuer | null {
    for (let idTokenIssuer of clusterConfiguration.idTokenIssuers) {
        if (idTokenIssuer.issuer === issuer) {
            return idTokenIssuer;
        }
    }
    return null;
}

