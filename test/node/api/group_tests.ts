import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../util/util";
import {StorageClient} from "../../../src/common/dataspace/api/StorageClient";
import {User} from "../../../src/common/dataspace/api/User";
import {Group} from "../../../src/common/dataspace/api/Group";

describe('Storage API / Testing groups resource ...', () => {
    let server: DataSpaceServer;
    const idToken = createTestIdToken();
    const client = new StorageClient("http://127.0.0.1:8889/api", "test", idToken);

    before(async () => {
        server = await startTestServer(server);
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
        expect(group!!.userIds.length).eq(1);
        expect(group!!.userIds[0]).eq("1");
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
        const group = await client.addGroup(new Group("test", []));
        expect(group.name).eq("test");
        expect(group.userIds.length).eq(0);

        const groupMember = await client.addGroupMember("test", "1");
        expect(groupMember.groupName, "test");
        expect(groupMember.userId, "1");

        const updatedGroup = await client.getGroup("test");
        expect(group.name).eq("test");
        expect(updatedGroup!!.userIds.length).eq(1);
        expect(updatedGroup!!.userIds[0]).eq("1");
    });

    it('It should remove member from group.', async () => {
        const group = await client.addGroup(new Group("test", []));
        expect(group.name).eq("test");
        expect(group.userIds.length).eq(0);

        const groupMember = await client.addGroupMember("test", "1");
        expect(groupMember.groupName, "test");
        expect(groupMember.userId, "1");
        expect(group.name).eq("test");

        expect((await client.getGroup("test"))!!.userIds.length).eq(1);

        await client.removeGroupMember("test", "1");
        expect(group.name).eq("test");

        expect((await client.getGroup("test"))!!.userIds.length).eq(0);
    });


});