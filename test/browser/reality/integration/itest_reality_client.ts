import { expect } from 'chai';

import {ClusterClient} from "../../../../src/common/reality/ClusterClient";
import {DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CONFIG_URL} from "../../../test";
import {createTestIdToken} from "../../browser-test-util";

describe('Integration Test Cluster Client', () => {
    let client: ClusterClient;
    const connectedRegions = new Set<string>();
    const loadedRegions = new Set<string>();

    before(async () => {
        console.log("\ntesting 0 0 0 in range.\n");
        client = new ClusterClient(PUBLIC_TEST_CLUSTER_CONFIG_URL, DEFAULT_DIMENSION, "1", 0, 0, 0, 0, 0, 0, 1, "<a-box/>", createTestIdToken());

        client.onConnect = (region: string) => {
            console.log("connected event: " + region);
            connectedRegions.add(region);
        };

        client.onLoaded = (region: string) => {
            console.log("loaded event: " + region);
            loadedRegions.add(region);
        };

        client.onDisconnect = (region: string) => {
            console.log("disconnected event: " + region);
            connectedRegions.delete(region);
            loadedRegions.delete(region);
        };

        await client.connect();
    });

    after(function() {
        client.close();
        expect(client.clients.size).equals(0);
    });


    it('Should connect client to cluster.', async () => {
        await client.refresh(0, 0, 0, 0, 0, 0, 1);
        expect(client.clients.size).equals(1);
        console.log(connectedRegions);
        console.log(loadedRegions);

        console.log("\ntesting 0 0 0 and 0 0 200 in range.\n");
        await client.refresh(0, 0, 95, 0, 0, 0, 1);
        expect(client.clients.size).equals(2);
        console.log(connectedRegions);
        console.log(loadedRegions);

        console.log("\ntesting 0 0 0 and 0 0 200 in range switching primary server.\n");
        await client.refresh(0, 0, 105, 0, 0, 0, 1);
        expect(client.clients.size).equals(2);
        console.log(connectedRegions);
        console.log(loadedRegions);

        console.log("\ntesting 0 0 100 in range.\n");
        await client.refresh(0, 0, 200, 0, 0, 0, 1);
        expect(client.clients.size).equals(1);
        console.log(connectedRegions);
        console.log(loadedRegions);

        console.log("\ntesting none in range.\n");
        await client.refresh(0, 0, 400, 0, 0, 0, 1);
        expect(client.clients.size).equals(0);
        console.log(connectedRegions);
        console.log(loadedRegions);

        console.log("\ntesting 0 0 100 in range.\n");
        await client.refresh(0, 0, 200, 0, 0, 0, 1);
        expect(client.clients.size).equals(1);
        console.log(connectedRegions);
        console.log(loadedRegions);

        console.log("\ndisconnecting.\n");
        client.close();
        expect(client.clients.size).equals(0);
        console.log(connectedRegions);
        console.log(loadedRegions);
    }).timeout(20000);;

});
