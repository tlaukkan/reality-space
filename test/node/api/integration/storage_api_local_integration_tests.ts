import 'mocha';
import {expect} from 'chai';
import {createTestIdToken, newStorageClient} from "../../util/util";
import {StorageClient} from "../../../../src/common/dataspace/api/StorageClient";

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
        const client = new StorageClient("0-0-0", "https://aframe-dataspace-storage-eu.herokuapp.com/api", "http://dataspace-eu.s3-website.eu-central-1.amazonaws.com/", createTestIdToken());;
        const users = await client.getUsers();
        expect(users[0].id).eq("anonymous");
        expect(users[0].name).eq("anonymous");
    });

});