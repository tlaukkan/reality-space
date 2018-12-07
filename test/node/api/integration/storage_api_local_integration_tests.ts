import 'mocha';
import {expect} from 'chai';
import {createTestIdToken} from "../../util/util";
import {StorageClient} from "../../../../src/common/dataspace/api/StorageClient";

describe('Storage API / Local integration testing', () => {
    const idToken = createTestIdToken();
    const client = new StorageClient("0_0_0", "http://127.0.0.1:8889/api", idToken);

    before(async () => {
    });

    beforeEach(async () => {
    });

    after(async () => {
    });

    it('It should get users.', async () => {
        const users = await client.getUsers();
        expect(users[0].id).eq("anonymous");
        expect(users[0].name).eq("anonymous");
    });

});