import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../src/common/dataspace/Encode";
import {Decode} from "../../../src/common/dataspace/Decode";
import {ClusterConfiguration, ServerInfo} from "../../../src/common/dataspace/Configuration";

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
        console.log(serialized);
    });

});