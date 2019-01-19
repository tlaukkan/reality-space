import 'mocha';
require('isomorphic-fetch');
import { expect } from 'chai';
import {ClusterClient} from "../../../../src/common/dataspace/ClusterClient";
import {w3cwebsocket} from "websocket";

describe('Integration Test Cluster Client', () => {
    let client: ClusterClient;

    before(async () => {
        console.log("\ntesting 0 0 0 in range.\n");
        client = new ClusterClient("default", "https://cdn.jsdelivr.net/gh/tlaukkan/aframe-dataspace/defaul-configuration.json", "1", 0, 0, 0, 0, 0, 0, 1, "<a-box/>", "");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    after(function() {
        client.close();
        expect(client.clients.size).equals(0);
    });


    it('Should connect client to cluster.', async () => {
        expect(client.clients.size).equals(1);

        console.log("\ntesting 0 0 0 and 0 0 100 in range.\n");
        await client.refresh(0, 0, 45, 0, 0, 0, 1);
        expect(client.clients.size).equals(2);

        console.log("\ntesting 0 0 0 and 0 0 100 in range switching primary server.\n");
        await client.refresh(0, 0, 55, 0, 0, 0, 1);
        expect(client.clients.size).equals(2);

        console.log("\ntesting 0 0 100 in range.\n");
        await client.refresh(0, 0, 100, 0, 0, 0, 1);
        expect(client.clients.size).equals(1);

        console.log("\ntesting none in range.\n");
        await client.refresh(0, 0, 200, 0, 0, 0, 1);
        expect(client.clients.size).equals(0);

        console.log("\ntesting 0 0 100 in range.\n");
        await client.refresh(0, 0, 100, 0, 0, 0, 1);
        expect(client.clients.size).equals(1);

        client.close();
        expect(client.clients.size).equals(0);
    });

});