import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {DocumentController} from "../../../../src/node/storage/DocumentController";
import {newLocalTestStorageClient, resetStorage, startLocalTestServer} from "../../util/util";
import {streamToString, stringToStream} from "../../util/util";

describe('Storage API / Testing user files ...', () => {
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

    it('It should add and remove test text user file.', async () => {
        const category = "test-user-text";
        const testUserFileName = "test-user-text-file.txt";
        const testText = "test-user-file-content";

        await client.removeUserFile(category, testUserFileName);
        expect((await client.listUserFiles(category)).length).eq(0);

        await client.saveUserFile(category, testUserFileName, stringToStream(testText));
        const readStream = await client.getUserFile(category, testUserFileName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const userFileNames = await client.listUserFiles(category);
        expect(userFileNames.length).eq(1);
        expect(userFileNames[0]).eq(testUserFileName);

        await client.removeUserFile(category, testUserFileName);

        expect((await client.listUserFiles(category)).length).eq(0);

    });

    it('It should add and remove test JSON user file.', async () => {
        const category = "test-user-json";
        const testUserFileName = "test-user-json-file.json";
        const testText = "test-user-file-content";

        await client.removeUserFile(category, testUserFileName);
        expect((await client.listUserFiles(category)).length).eq(0);

        await client.saveUserFile(category, testUserFileName, stringToStream(testText));
        const readStream = await client.getUserFile(category, testUserFileName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const userFileNames = await client.listUserFiles(category);
        expect(userFileNames.length).eq(1);
        expect(userFileNames[0]).eq(testUserFileName);

        await client.removeUserFile(category, testUserFileName);

        expect((await client.listUserFiles(category)).length).eq(0);

    });


    it('It should add and remove test GLB user file.', async () => {
        const category = "test-user-glb";
        const testUserFileName = "test-user-glb-file.glb";
        const testText = "test-user-file-content";

        await client.removeUserFile(category, testUserFileName);
        expect((await client.listUserFiles(category)).length).eq(0);

        await client.saveUserFile(category, testUserFileName, stringToStream(testText));
        const readStream = await client.getUserFile(category, testUserFileName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const userFileNames = await client.listUserFiles(category);
        expect(userFileNames.length).eq(1);
        expect(userFileNames[0]).eq(testUserFileName);

        await client.removeUserFile(category, testUserFileName);

        expect((await client.listUserFiles(category)).length).eq(0);

    });

});