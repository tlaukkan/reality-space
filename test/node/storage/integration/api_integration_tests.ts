import 'mocha';
import {expect} from 'chai';
import {createTestIdToken, newLocalTestStorageClient} from "../../util/util";
import {StorageClient} from "../../../../src/common/reality/StorageClient";
import {
    DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CDN_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME,
    PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../../test";

describe('Storage API / Local integration testing', () => {

    before(async () => {
    });

    beforeEach(async () => {
    });

    after(async () => {
    });

    /*it('It should get users from localhost.', async () => {
        const client = new StorageClient("test", "http://127.0.0.1:8889/api", "http://localhost:8889/repository", createTestIdToken());;
        const users = await client.getUsers();
        expect(users[0].id).eq("anonymous");
        expect(users[0].name).eq("anonymous");
    });*/

    it('It should get users from aframe-dataspace-storage-eu.herokuapp.com.', async () => {
        const client = new StorageClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, PUBLIC_TEST_CLUSTER_STORAGE_URL, PUBLIC_TEST_CLUSTER_CDN_URL, createTestIdToken());;
        const users = await client.getUsers();
        expect(users[0].id).eq("anonymous");
        expect(users[0].name).eq("anonymous");
    });

});