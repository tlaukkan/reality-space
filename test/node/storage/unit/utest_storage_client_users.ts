import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {newLocalTestStorageClient, resetStorage, startLocalTestServer} from "../../util/util";
import {User} from "../../../../src/common/reality/api/User";

describe('Storage API / Testing users resource ...', () => {
    let server: RealityServer;
    const client = newLocalTestStorageClient();

    before(async () => {
        server = await startLocalTestServer();
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(async () => {
        await server.close();
    });

    it('It should get users.', async () => {
        const users = await client.getUsers();
        expect(users.length).eq(2);
        expect(users[0].id).eq("anonymous");
        expect(users[0].name).eq("anonymous");
        expect(users[1].id).eq("1");
        expect(users[1].name).eq("test");
        expect(users[1].groupNames.length).eq(0);
    });

    it('It should get user.', async () => {
        const user = await client.getUser("1");
        expect(user!!.id).eq("1");
        expect(user!!.name).eq("test");
        expect(user!!.groupNames.length).eq(0);
    });

    it('It should get non existent user.', async () => {
        const user = await client.getUser("9");
        expect(user).to.be.undefined;
    });

    it('It should add user.', async () => {
        const user = await client.addUser(new User("2", "test-2", []));
        expect(user!!.id).eq("2");
        expect(user!!.name).eq("test-2");
        expect(user!!.groupNames.length).eq(0);
    });

    it('It should update user.', async () => {
        const user = await client.addUser(new User("2", "test-2", []));
        expect(user!!.id).eq("2");
        expect(user!!.name).eq("test-2");
        const updateUser = await client.updateUser(new User("2", "test-2-updated", []));
        expect(updateUser!!.id).eq("2");
        expect(updateUser!!.name).eq("test-2-updated");
        expect(user!!.groupNames.length).eq(0);
    });

    it('It should remove user.', async () => {
        const user = await client.addUser(new User("2", "test-2", []));
        expect(user!!.id).eq("2");
        expect(user!!.name).eq("test-2");
        await client.removeUser("2");
        const removedUsed = await client.getUser("2");
        expect(removedUsed).to.be.undefined;
    });

});