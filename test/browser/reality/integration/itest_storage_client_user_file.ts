import {expect} from 'chai';
import {DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CONFIG_URL} from "../../../test";
import {ClusterClient} from "../../../../src";
import {createTestIdToken} from "../../browser-test-util";

describe('Storage API / Integration testing user file API ...', () => {
    let client: ClusterClient;

    before(async () => {
        console.log("\ntesting 0 0 0 in range.\n");
        client = new ClusterClient(PUBLIC_TEST_CLUSTER_CONFIG_URL, DEFAULT_DIMENSION, "1", 0, 0, 0, 0, 0, 0, 1, "<a-box/>", createTestIdToken());
        await client.connect();
    });

    after(function() {
        client.close();
        expect(client.clients.size).equals(0);
    });

    it('It should add and remove test text user file.', async () => {

        /*const testUserFileName = "test-user-text-file.txt";
        const testText = "test-user-file-content";

        await client.defaultStorageClient!!.removeUserFile("tests", testUserFileName);
        expect((await client.defaultStorageClient!!.listUserFiles("tests")).length).eq(0);

        await client.defaultStorageClient!!.saveUserFile("tests", testUserFileName, stringToStream(testText));
        const readStream = await client.defaultStorageClient!!.getUserFile("tests", testUserFileName);
        expect(readStream).exist;

        let loadedText = await streamToString(readStream!!);
        expect(loadedText).eq(testText);

        const userFileNames = await client.defaultStorageClient!!.listUserFiles("tests");
        expect(userFileNames.length).eq(1);
        expect(userFileNames[0]).eq(testUserFileName);

        await client.defaultStorageClient!!.removeUserFile("tests", testUserFileName);

        expect((await client.defaultStorageClient!!.listUserFiles("tests")).length).eq(0);*/

    });

});