const config = require('config');

import {
    fetchConfiguration,
    getProcessorConfiguration, getStorageConfiguration,
    IdTokenIssuer,
    ProcessorConfiguration,
    SanitizerConfig,
    StorageConfiguration
} from "../../common/dataspace/Configuration";

export async function loadConfiguration(): Promise<[SanitizerConfig, ProcessorConfiguration | undefined, StorageConfiguration | undefined, Array<IdTokenIssuer>]> {
    const clusterConfigurationUrl = config.get('Cluster.configurationUrl') as string;
    console.log("Cluster configuration URL: " + clusterConfigurationUrl);
    const processorWsUrl = config.get('Processor.wsUrl');
    console.log("Processor WS URL: " + processorWsUrl);
    const storageApiUrl = config.get('Storage.apiUrl');
    console.log("Storage API URL: " + storageApiUrl);

    const clusterConfiguration = await fetchConfiguration(clusterConfigurationUrl);
    if (clusterConfiguration) {

        console.log("Cluster configuration: " +  + JSON.stringify(clusterConfiguration, null, 2));

        const serverConfiguration = processorWsUrl ? getProcessorConfiguration(clusterConfiguration, processorWsUrl) : undefined;
        const storageConfiguration = storageApiUrl ? getStorageConfiguration(clusterConfiguration, storageApiUrl!!) : undefined;
        const idTokenIssuers = clusterConfiguration.idTokenIssuers;

        return [clusterConfiguration.sanitizer, serverConfiguration, storageConfiguration, idTokenIssuers];
    } else {
        console.log("Cluster configuration URL not defined. Loading local configuration.");

        const sanitizeConfig = new SanitizerConfig();
        sanitizeConfig.allowedElements = config.get('Sanitizer.allowedElements');
        sanitizeConfig.allowedAttributes = config.get('Sanitizer.allowedAttributes');
        sanitizeConfig.allowedAttributeValueRegex = config.get('Sanitizer.allowedAttributeValueRegex');

        return [
            sanitizeConfig,
            new ProcessorConfiguration(
                "0_0_0",
                "ws://localhost:8889/",
                process.env.GRID_CX as any || 0,
                process.env.GRID_CY as any || 0,
                process.env.GRID_CZ as any || 0,
                process.env.GRID_EDGE as any || 140,
                process.env.GRID_STEP as any || 10,
                process.env.GRID_RANGE as any || 20),
            new StorageConfiguration(
                "http://localhost:8889/api",
                [
                    "0_0_0"
                ]),
            [
                new IdTokenIssuer(
                    "test-issuer",
                    "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==")
            ]
        ];
    }
}