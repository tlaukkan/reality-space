import 'mocha';
import { expect } from 'chai';
import {
    ClusterConfiguration,
    fetchConfiguration, getConfiguration,
    loadConfiguration,
    ServerInfo
} from "../../../src/common/dataspace/Configuration";

describe('Test Configuration', () => {

    it('should serialize and deserialize configuration', () => {
        const original = new ClusterConfiguration();
        original.servers.push(new ServerInfo());
        let serialized = JSON.stringify(original, null, 2);
        let parsed = JSON.parse(serialized) as ClusterConfiguration;
        expect(parsed.edge).to.equal(original.edge);
        expect(parsed.servers.length).to.equal(original.servers.length);
        let serialized2 = JSON.stringify(parsed, null, 2);
        expect(serialized2).to.equal(serialized);
    });

    it('should get and deserialize default configuration from rawgit.', async() => {
        const configuration = await getConfiguration("https://rawgit.com/tlaukkan/aframe-dataspace/master/defaul-configuration.json");
        expect(configuration.servers.length).to.be.greaterThan(0);
    });

    it('should get and deserialize default configuration from file.', async() => {
        const configuration = await getConfiguration('defaul-configuration.json');
        expect(configuration.servers.length).to.be.greaterThan(0);
    });

});