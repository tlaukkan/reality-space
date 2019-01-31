const config = require('config');

import {
    ClusterConfiguration,
    fetchConfiguration,
    IdTokenIssuer, RegionConfiguration,
    SanitizerConfiguration,
} from "../../common/reality/Configuration";

export async function loadConfiguration(clusterConfigurationUrl: string): Promise<ClusterConfiguration> {

    const clusterConfiguration = await fetchConfiguration(clusterConfigurationUrl);
    if (clusterConfiguration) {
        return clusterConfiguration;
    } else {
        console.log("Cluster configuration URL not defined. Loading local configuration.");

        const sanitizeConfig = new SanitizerConfiguration();
        sanitizeConfig.allowedElements = config.get('Sanitizer.allowedElements');
        sanitizeConfig.allowedAttributes = config.get('Sanitizer.allowedAttributes');
        sanitizeConfig.allowedAttributeValueRegex = config.get('Sanitizer.allowedAttributeValueRegex');

        const processorConfig = new RegionConfiguration();
        processorConfig.region = "0-0-0";
        processorConfig.processorUrl = "ws://localhost:3002/";
        processorConfig.storageUrl = "http://localhost:3002/api/";
        processorConfig.cdnUrl  = "http://localhost:3002/api/";
        processorConfig.spaces = ["default"];
        processorConfig.maxSpaces = 10;
        processorConfig.edge = process.env.GRID_EDGE as any || 140;
        processorConfig.step = process.env.GRID_STEP as any || 10;
        processorConfig.range = process.env.GRID_RANGE as any || 20;
        processorConfig.x = process.env.GRID_CX as any || 0;
        processorConfig.y = process.env.GRID_CY as any || 0;
        processorConfig.z = process.env.GRID_CZ as any || 0;

        const clusterConfiguration = new ClusterConfiguration();
        clusterConfiguration.name = "local-cluster";
        clusterConfiguration.description = "local-cluster";
        clusterConfiguration.edge = 1000;
        clusterConfiguration.step = 100;
        clusterConfiguration.range = 200;
        clusterConfiguration.spaces = ["default"];
        clusterConfiguration.maxSpaces = 10;
        clusterConfiguration.processorUrl = "ws://localhost:3002/";
        clusterConfiguration.storageUrl = "http://localhost:3002/api/";
        clusterConfiguration.cdnUrl = "http://localhost:3002/api/";
        clusterConfiguration.sanitizer = sanitizeConfig;
        clusterConfiguration.regions = [processorConfig];
        clusterConfiguration.idTokenIssuers = [
            new IdTokenIssuer(
                "test-issuer",
                "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==")
        ];

        return clusterConfiguration;
    }
}