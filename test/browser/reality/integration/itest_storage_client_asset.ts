import {expect} from 'chai';
import {DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CONFIG_URL} from "../../../test";
import {ClusterClient} from "../../../../src";
import {createTestIdToken, streamToString, stringToStream} from "../../browser-test-util";

describe('Storage API / Integration testing asset API...', () => {
    let client: ClusterClient;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    before(async () => {
        client = new ClusterClient(PUBLIC_TEST_CLUSTER_CONFIG_URL, DEFAULT_DIMENSION, "1", 0, 0, 0, 0, 0, 0, 1, "<a-box/>", createTestIdToken());
        await client.connect();
    });

    after(function() {
        client.close();
        expect(client.clients.size).equals(0);
    });

    it('It should add and remove plain text asset.', async () => {
        const category = "integration-test-asset-text";
        const testAssetName = "test-text.txt";
        const testText = "test-data";

        await client.getHomeStorage().removeAsset(category, testAssetName);
        expect((await client.getHomeStorage().listAssets(category)).length).eq(0);

        await client.getHomeStorage().saveAssetBuffer(category, testAssetName, encoder.encode(testText).buffer, "");

        let loadedTestBuffer = await client.getHomeStorage().getAssetBuffer(category, testAssetName);

        const loadedText= decoder.decode(loadedTestBuffer);
        expect(loadedText).eq(testText);

        const assetNames = await client.getHomeStorage().listAssets(category);
        expect(assetNames.length).eq(1);
        expect(assetNames[0]).eq(testAssetName);

        await client.getHomeStorage().removeAsset(category, testAssetName);

        expect((await client.getHomeStorage().listAssets(category)).length).eq(0);
    }).timeout(5000);




});