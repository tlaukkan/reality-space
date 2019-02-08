import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {DocumentController} from "../../../../src/node/storage/DocumentController";
import {newLocalTestStorageClient, resetStorage, startLocalTestServer} from "../../util/util";
import {streamToString, stringToStream} from "../../util/util";

describe('Storage API / Testing entity resource ...', () => {
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

    it('It should add and remove asset.', async () => {

        const testAssetName = "test-asset.txt";
        const testText = "test-data";

        await client.removeAsset("tests", testAssetName);
        expect((await client.listAssets("tests")).length).eq(0);

        await client.saveAsset("tests", testAssetName, stringToStream(testText));
        const readStream = await client.getAsset("tests", testAssetName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const assetNames = await client.listAssets("tests");
        expect(assetNames.length).eq(1);
        expect(assetNames[0]).eq(testAssetName);

        await client.removeAsset("tests", testAssetName);

        expect((await client.listAssets("tests")).length).eq(0);

    });



});