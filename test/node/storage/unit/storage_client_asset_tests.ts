import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {DocumentController} from "../../../../src/node/storage/DocumentController";
import {newLocalTestStorageClient, resetStorage, startLocalTestServer} from "../../util/util";
import {Readable} from "stream";

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

        const encoder = new TextEncoder();
        const decoder = new TextDecoder("utf-8");

        const testAssetName = "test-asset.txt";
        const testText = "test-data";

        await client.removeAsset("tests", testAssetName);

        expect((await client.listAssets("tests")).length).eq(0);

        const stream = new Readable() as any;
        stream._read = () => {}; // redundant? see update below
        stream.push(encoder.encode(testText));
        stream.push(null);

        await client.saveAsset("tests", testAssetName, stream);
        const readStream = await client.getAsset("tests", testAssetName);
        expect(readStream).exist;

        let loadedText = '';
        for await (const chunk of readStream as any) {
            loadedText += decoder.decode(chunk);
        }

        expect(loadedText).eq(testText);

        const assetNames = await client.listAssets("tests");
        expect(assetNames.length).eq(1);
        expect(assetNames[0]).eq(testAssetName);

        await client.removeAsset("tests", testAssetName);

        expect((await client.listAssets("tests")).length).eq(0);

    });



});