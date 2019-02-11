import 'mocha';
import {expect} from 'chai';
import {createTestIdToken} from "../../util/util";
import {streamToString, stringToStream} from "../../util/util";
import {StorageClient} from "../../../../src/common/reality/StorageClient";
import {
    DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CDN_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME,
    PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../../test";

describe('Storage API / Testing assets ...', function () {
    const client = new StorageClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, PUBLIC_TEST_CLUSTER_STORAGE_URL, PUBLIC_TEST_CLUSTER_CDN_URL, createTestIdToken());

    before(async () => {
    });

    beforeEach(async () => {
    });

    after(async () => {
    });

    it('It should add and remove plain text asset.', async function () {
        const category = "test-text";
        const testAssetName = "test-text.txt";
        const testText = "test-data";

        await client.removeAsset(category, testAssetName);
        expect((await client.listAssets(category)).length).eq(0);

        await client.saveAsset(category, testAssetName, stringToStream(testText));
        const readStream = await client.getAsset(category, testAssetName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const assetNames = await client.listAssets(category);
        expect(assetNames.length).eq(1);
        expect(assetNames[0]).eq(testAssetName);

        await client.removeAsset(category, testAssetName);

        expect((await client.listAssets(category)).length).eq(0);
    }).timeout(5000);

    it('It should add and remove JSON asset.', async () => {
        const category = "test-json";
        const testAssetName = "test-json.json";
        const testText = "test-data";

        await client.removeAsset(category, testAssetName);
        expect((await client.listAssets(category)).length).eq(0);

        await client.saveAsset(category, testAssetName, stringToStream(testText));
        const readStream = await client.getAsset(category, testAssetName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const assetNames = await client.listAssets(category);
        expect(assetNames.length).eq(1);
        expect(assetNames[0]).eq(testAssetName);

        await client.removeAsset(category, testAssetName);

        expect((await client.listAssets(category)).length).eq(0);
    }).timeout(5000);

    it('It should add and remove GLB asset.', async () => {
        const category = "test-glb";
        const testAssetName = "test-glb.glb";
        const testText = "test-data";

        await client.removeAsset(category, testAssetName);
        expect((await client.listAssets(category)).length).eq(0);

        await client.saveAsset(category, testAssetName, stringToStream(testText));
        const readStream = await client.getAsset(category, testAssetName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const assetNames = await client.listAssets(category);
        expect(assetNames.length).eq(1);
        expect(assetNames[0]).eq(testAssetName);

        await client.removeAsset(category, testAssetName);

        expect((await client.listAssets(category)).length).eq(0);
    }).timeout(5000);
    
});