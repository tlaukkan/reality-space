import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {DocumentController} from "../../../../src/node/storage/DocumentController";
import {newLocalTestStorageClient, resetStorage, startLocalTestServer} from "../../util/util";
import {streamToString, stringToStream} from "../../util/util";

describe('Storage API / Testing assets ...', () => {
    const client = newLocalTestStorageClient();
    let server: RealityServer;
    let parser: DocumentController;

    before(async () => {
        server = await startLocalTestServer();
        parser = server.storageManager!!.storages.get("default")!!.get("test")!!.documentController;
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(async () => {
        await server.close();
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