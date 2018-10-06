import 'mocha';
import { expect } from 'chai';

import {Client} from "../../../../src/common/dataspace/Client";
import {ClusterClient} from "../../../../src/common/dataspace/ClusterClient";

describe('Integration Test Cluster Client', () => {

    it('Should connect client to localhost.', async () => {
        const client = new ClusterClient("https://rawgit.com/tlaukkan/aframe-dataspace/master/defaul-configuration.json", "1", 0, 0, 0, 0, 0, 0, 1, "d");
        await client.connect();
        expect(client.clients.size).equals(1);
        await client.refresh(0, 0, 110, 0, 0, 0, 1);
        expect(client.clients.size).equals(2);
        client.close();
        expect(client.clients.size).equals(0);
    });

});