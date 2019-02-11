import {expect} from 'chai';
import {DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CONFIG_URL} from "../../../test";
import {ClusterClient} from "../../../../src";
import {createTestIdToken, streamToString, stringToStream} from "../../browser-test-util";

describe('Storage API / Integration testing asset API...', () => {
    let client: ClusterClient;

    before(async () => {
        client = new ClusterClient(PUBLIC_TEST_CLUSTER_CONFIG_URL, DEFAULT_DIMENSION, "1", 0, 0, 0, 0, 0, 0, 1, "<a-box/>", createTestIdToken());
        await client.connect();
    });

    after(function() {
        client.close();
        expect(client.clients.size).equals(0);
    });

    it('It should add and remove plain text asset.', async function () {
        const testAssetName = "test-text.txt";
        const testText = "test-data";

        await client.defaultStorageClient!!.removeAsset("tests", testAssetName);
        expect((await client.defaultStorageClient!!.listAssets("tests")).length).eq(0);

        await client.defaultStorageClient!!.saveAsset("tests", testAssetName, stringToStream(testText));
        const readStream = await client.defaultStorageClient!!.getAsset("tests", testAssetName);
        expect(readStream).exist;
        console.log("RECEIVED STREAM.");

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);
        console.log("RECEIVED CORRECT.");

        const assetNames = await client.defaultStorageClient!!.listAssets("tests");
        expect(assetNames.length).eq(1);
        expect(assetNames[0]).eq(testAssetName);

        await client.defaultStorageClient!!.removeAsset("tests", testAssetName);

        expect((await client.defaultStorageClient!!.listAssets("tests")).length).eq(0);
    }).timeout(5000);




});