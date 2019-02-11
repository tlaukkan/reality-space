import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {createTestIdToken, newLocalTestStorageClient, resetStorage, startLocalTestServer} from "../../util/util";
import {Group} from "../../../../src/common/reality/api/Group";
import {User} from "../../../../src/common/reality/api/User";

describe('Storage API / Testing groups resource ...', () => {
    let server: RealityServer;
    const idToken = createTestIdToken();
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

    it('It should get groups.', async () => {
        const groups = await client.getGroups();
        expect(groups.length).eq(4);
    });

    it('It should get group.', async () => {
        const group = await client.getGroup("administrators");
        expect(group!!.name).eq("administrators");
        expect(group!!.userIds.length).eq(0);
    });

    it('It should get non existent group.', async () => {
        const group = await client.getGroup("non-existent");
        expect(group).to.be.undefined;
    });

    it('It should add group.', async () => {
        const group = await client.addGroup(new Group("test", []));
        expect(group.name).eq("test");
        expect(group.userIds.length).eq(0);
    });

    it('It should remove group.', async () => {
        const group = await client.addGroup(new Group("test", []));
        expect(group.name).eq("test");
        expect(group.userIds.length).eq(0);
        await client.removeGroup("test");
        const removedGroup = await client.getGroup("test");
        expect(removedGroup).to.be.undefined;
    });

    it('It should add member to group.', async () => {
        const user = await client.addUser(new User("2", "test-2", []));

        const group = await client.addGroup(new Group("test2", []));
        expect(group.name).eq("test2");
        expect(group.userIds.length).eq(0);

        const groupMember = await client.addGroupMember("test2", "2");
        expect(groupMember.groupName, "test2");
        expect(groupMember.userId, "2");

        const updatedGroup = await client.getGroup("test2");
        expect(group.name).eq("test2");
        expect(updatedGroup!!.userIds.length).eq(1);
        expect(updatedGroup!!.userIds[0]).eq("2");
    });

    it('It should remove member from group.', async () => {
        const user = await client.addUser(new User("2", "test-2", []));

        const group = await client.addGroup(new Group("test2", []));
        expect(group.name).eq("test2");
        expect(group.userIds.length).eq(0);

        const groupMember = await client.addGroupMember("test2", "2");
        expect(groupMember.groupName, "test2");
        expect(groupMember.userId, "2");
        expect(group.name).eq("test2");

        expect((await client.getGroup("test2"))!!.userIds.length).eq(1);

        await client.removeGroupMember("test2", "2");
        expect(group.name).eq("test2");

        expect((await client.getGroup("test2"))!!.userIds.length).eq(0);
    });


});