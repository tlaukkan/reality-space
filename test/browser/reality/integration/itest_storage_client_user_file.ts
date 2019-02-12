import {expect} from 'chai';
import {DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CONFIG_URL} from "../../../test";
import {ClusterClient} from "../../../../src";
import {createTestIdToken} from "../../browser-test-util";

describe('Storage API / Integration testing user file API ...', () => {
    let client: ClusterClient;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

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
        const category = "integration-test-user-file-text";
        const testUserFileName = "test-user-text-file.txt";
        const testText = "test-user-file-content";

        await client.getHomeStorage().removeUserFile(category, testUserFileName);
        expect((await client.getHomeStorage().listUserFiles(category)).length).eq(0);

        await client.getHomeStorage().saveUserFileBuffer(category, testUserFileName, encoder.encode(testText).buffer, "");
        let loadedTestBuffer = await client.getHomeStorage().getUserFileBuffer(category, testUserFileName);

        const loadedText= decoder.decode(loadedTestBuffer);
        expect(loadedText).eq(testText);
        expect(loadedText).eq(testText);

        const userFileNames = await client.getHomeStorage().listUserFiles(category);
        expect(userFileNames.length).eq(1);
        expect(userFileNames[0]).eq(testUserFileName);

        await client.getHomeStorage().removeUserFile(category, testUserFileName);

        expect((await client.getHomeStorage().listUserFiles(category)).length).eq(0);

    }).timeout(5000);

});