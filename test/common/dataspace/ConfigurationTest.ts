import { expect } from 'chai';
import {
    ClusterConfiguration,
    getProcessorConfiguration,
    findItTokenIssuerConfiguration,
    getClusterConfiguration,
    IdTokenIssuer,
    ProcessorConfig,
    getStorageConfiguration
} from "../../../src/common/dataspace/Configuration";
import {
    PUBLIC_TEST_CLUSTER_CDN_URL,
    PUBLIC_TEST_CLUSTER_CONFIG_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_100_NAME,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_100_URL,
    PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../test";

describe('Test Configuration', () => {

    it('should serialize and deserialize configuration', () => {
        const original = new ClusterConfiguration();
        original.processors.push(new ProcessorConfig());
        original.idTokenIssuers.push(new IdTokenIssuer('test-issuer', 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg=='));
        let serialized = JSON.stringify(original, null, 2);
        //console.log(serialized);
        let parsed = JSON.parse(serialized) as ClusterConfiguration;
        expect(parsed.edge).to.equal(original.edge);
        expect(parsed.processors.length).to.equal(original.processors.length);
        expect(parsed.idTokenIssuers.length).to.equal(original.idTokenIssuers.length);
        let serialized2 = JSON.stringify(parsed, null, 2);
        expect(serialized2).to.equal(serialized);
    });

    it('should get and deserialize default configuration from network.', async() => {
        const configuration = await getClusterConfiguration(PUBLIC_TEST_CLUSTER_CONFIG_URL);
        console.log(JSON.stringify(configuration, null, 2));
        expect(configuration.processors.length).to.be.greaterThan(0);
        expect(configuration.processors[0].cdnUrl).eq(PUBLIC_TEST_CLUSTER_CDN_URL);

        const processorConfiguration = getProcessorConfiguration(configuration,  PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_100_URL);
        expect(processorConfiguration.size).equals(1);

        expect(processorConfiguration.has("0-0-100")).true;
        expect(processorConfiguration.get("0-0-100")!!.name).equals(PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_100_NAME);
        expect(processorConfiguration.get("0-0-100")!!.dimensions.length).equals(1);
        expect(processorConfiguration.get("0-0-100")!!.dimensions[0]).equals("default");
        expect(processorConfiguration.get("0-0-100")!!.maxDimensions).equals(20);
        expect(processorConfiguration.get("0-0-100")!!.x).equals(0);
        expect(processorConfiguration.get("0-0-100")!!.y).equals(0);
        expect(processorConfiguration.get("0-0-100")!!.z).equals(100);
        expect(processorConfiguration.get("0-0-100")!!.edge).equals(140);
        expect(processorConfiguration.get("0-0-100")!!.step).equals(10);
        expect(processorConfiguration.get("0-0-100")!!.range).equals(20);

        const storageApiConfiguration = getStorageConfiguration(configuration, PUBLIC_TEST_CLUSTER_STORAGE_URL);

        expect(storageApiConfiguration.processorNames.length).eq(2);
        expect(storageApiConfiguration.processorNames[0]).eq(PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME);
        expect(storageApiConfiguration.processorNames[1]).eq(PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_100_NAME);

        expect(configuration.idTokenIssuers.length).to.be.greaterThan(0);
        const idTokenIssuer = findItTokenIssuerConfiguration(configuration, "test-issuer")!!;
        expect(idTokenIssuer.issuer).equals("test-issuer");
        expect(idTokenIssuer.publicKey).equals("LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==");
    });
});