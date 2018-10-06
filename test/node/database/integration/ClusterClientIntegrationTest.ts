import 'mocha';
import { expect } from 'chai';

import {Client} from "../../../../src/common/dataspace/Client";
import {ClusterClient} from "../../../../src/common/dataspace/ClusterClient";

describe('Integration Test Cluster Client', () => {
    let client: ClusterClient;

    before(async () => {
        client = new ClusterClient("https://cdn.rawgit.com/tlaukkan/aframe-dataspace/f197b55b/defaul-configuration.json", "1", 0, 0, 0, 0, 0, 0, 1, "d");
        await client.connect();
    });

    after(function() {
        client.close();
        expect(client.clients.size).equals(0);
    });


    it('Should connect client to localhost.', async () => {
        expect(client.clients.size).equals(1);
        await client.refresh(0, 0, 50, 0, 0, 0, 1);
        expect(client.clients.size).equals(2);
        await client.refresh(0, 0, 100, 0, 0, 0, 1);
        expect(client.clients.size).equals(1);
        await client.refresh(0, 0, 200, 0, 0, 0, 1);
        expect(client.clients.size).equals(0);
        await client.refresh(0, 0, 100, 0, 0, 0, 1);
        expect(client.clients.size).equals(1);
        client.close();
        expect(client.clients.size).equals(0);
    });

});