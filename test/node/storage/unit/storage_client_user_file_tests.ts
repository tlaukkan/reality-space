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

    it('It should add and remove test user file.', async () => {

        const testUserFileName = "test-user-file.txt";
        const testText = "test-user-file-content";

        await client.removeUserFile("tests", testUserFileName);
        expect((await client.listUserFiles("tests")).length).eq(0);

        await client.saveUserFile("tests", testUserFileName, stringToStream(testText));
        const readStream = await client.getUserFile("tests", testUserFileName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const userFileNames = await client.listUserFiles("tests");
        expect(userFileNames.length).eq(1);
        expect(userFileNames[0]).eq(testUserFileName);

        await client.removeUserFile("tests", testUserFileName);

        expect((await client.listUserFiles("tests")).length).eq(0);

    });



});