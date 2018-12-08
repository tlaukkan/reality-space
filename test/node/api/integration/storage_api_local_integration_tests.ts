import 'mocha';
import {expect} from 'chai';
import {newStorageClient} from "../../util/util";

describe('Storage API / Local integration testing', () => {
    const client = newStorageClient();

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