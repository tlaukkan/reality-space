import { expect } from 'chai';
import { ClusterConfiguration, findGridConfiguration, getClusterConfiguration,
    ServerConfig} from "../../../src/common/dataspace/Configuration";

describe('Test Configuration', () => {

    it('should serialize and deserialize configuration', () => {
        const original = new ClusterConfiguration();
        original.servers.push(new ServerConfig());
        let serialized = JSON.stringify(original, null, 2);
        let parsed = JSON.parse(serialized) as ClusterConfiguration;
        expect(parsed.edge).to.equal(original.edge);
        expect(parsed.servers.length).to.equal(original.servers.length);
        let serialized2 = JSON.stringify(parsed, null, 2);
        expect(serialized2).to.equal(serialized);
    });

    it('should get and deserialize default configuration from rawgit.', async() => {
        const configuration = await getClusterConfiguration("https://cdn.jsdelivr.net/gh/tlaukkan/aframe-dataspace/defaul-configuration.json");
        expect(configuration.servers.length).to.be.greaterThan(0);
        const serverConfiguration = findGridConfiguration(configuration, "wss://aframe-dataspace-0-0-100.herokuapp.com/");
        expect(serverConfiguration.cx).equals(0);
        expect(serverConfiguration.cy).equals(0);
        expect(serverConfiguration.cz).equals(100);
    });
});