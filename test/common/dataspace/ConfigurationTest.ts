import { expect } from 'chai';
import {
    ClusterConfiguration,
    getProcessorConfiguration,
    findItTokenIssuerConfiguration,
    getClusterConfiguration,
    IdTokenIssuer,
    ServerConfig,
    getStorageConfiguration
} from "../../../src/common/dataspace/Configuration";

describe('Test Configuration', () => {

    it('should serialize and deserialize configuration', () => {
        const original = new ClusterConfiguration();
        original.servers.push(new ServerConfig());
        original.idTokenIssuers.push(new IdTokenIssuer('test-issuer', 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg=='));
        let serialized = JSON.stringify(original, null, 2);
        //console.log(serialized);
        let parsed = JSON.parse(serialized) as ClusterConfiguration;
        expect(parsed.edge).to.equal(original.edge);
        expect(parsed.servers.length).to.equal(original.servers.length);
        expect(parsed.idTokenIssuers.length).to.equal(original.idTokenIssuers.length);
        let serialized2 = JSON.stringify(parsed, null, 2);
        expect(serialized2).to.equal(serialized);
    });

    it('should get and deserialize default configuration from rawgit.', async() => {
        const configuration = await getClusterConfiguration("https://cdn.jsdelivr.net/gh/tlaukkan/aframe-dataspace@0.0.13/defaul-configuration.json");
        console.log(JSON.stringify(configuration));
        expect(configuration.servers.length).to.be.greaterThan(0);
        expect(configuration.servers[0].assetUrl).eq("http://dataspace-eu.s3-website.eu-central-1.amazonaws.com/");

        const processorConfiguration = getProcessorConfiguration(configuration, "wss://aframe-dataspace-0-0-100.herokuapp.com/");
        const storageApiConfiguration = getStorageConfiguration(configuration, "https://aframe-dataspace-storage.herokuapp.com/api");

        expect(processorConfiguration.name).equals("0-0-100");
        expect(processorConfiguration.cx).equals(0);
        expect(processorConfiguration.cy).equals(0);
        expect(processorConfiguration.cz).equals(100);
        expect(processorConfiguration.edge).equals(140);
        expect(processorConfiguration.step).equals(10);
        expect(processorConfiguration.range).equals(20);

        expect(storageApiConfiguration.serverNames.length).eq(2);
        expect(storageApiConfiguration.serverNames[0]).eq("0-0-0");
        expect(storageApiConfiguration.serverNames[1]).eq("0-0-100");

        expect(configuration.idTokenIssuers.length).to.be.greaterThan(0);
        const idTokenIssuer = findItTokenIssuerConfiguration(configuration, "test-issuer")!!;
        expect(idTokenIssuer.issuer).equals("test-issuer");
        expect(idTokenIssuer.publicKey).equals("LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==");
    });
});