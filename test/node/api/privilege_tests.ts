import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../util/util";
import {StorageClient} from "../../../src/common/dataspace/api/StorageClient";
import {User} from "../../../src/common/dataspace/api/User";
import {PrivilegeType} from "../../../src/common/dataspace/api/PrivilegeType";
import {Group} from "../../../src/common/dataspace/api/Group";

describe('Storage API / Testing privileges ...', () => {
    let server: DataSpaceServer;
    const idToken = createTestIdToken();
    const client = new StorageClient("test", "http://127.0.0.1:8889/api", "http://localhost:8889/repository", idToken);

    before(async () => {
        server = await startTestServer(server);
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(async () => {
        await server.close();
    });

    it('It should get user privileges.', async () => {
        const privileges = await client.getUserPrivileges("1");
        expect(privileges.length).eq(0);
    });

    it('It should get group privileges.', async () => {
        const privileges = await client.getGroupPrivileges("administrators");
        console.log(privileges);
        expect(privileges.length).eq(1);
        expect(privileges[0].type).eq(PrivilegeType.ADMIN);
        expect(privileges[0].name).eq("administrators");
    });

    it('It should add user privileges.', async () => {
        expect((await client.getUserPrivileges("1")).length).eq(0);

        const privilege = await client.setUserPrivilege("1", "", PrivilegeType.VIEW);
        expect(privilege.userId).eq("1");
        expect(privilege.type).eq(PrivilegeType.VIEW);
        expect(privilege.sid).eq("");

        const privileges = await client.getUserPrivileges("1");
        expect(privileges.length).eq(1);
        expect(privileges[0].userId).eq("1");
        expect(privileges[0].type).eq(PrivilegeType.VIEW);
        expect(privileges[0].sid).eq("");
    });

    it('It should remove user privileges.', async () => {
        expect((await client.getUserPrivileges("1")).length).eq(0);

        const privilege = await client.setUserPrivilege("1", "", PrivilegeType.VIEW);
        expect(privilege.userId).eq("1");
        expect(privilege.type).eq(PrivilegeType.VIEW);
        expect(privilege.sid).eq("");

        const privileges = await client.getUserPrivileges("1");
        expect(privileges.length).eq(1);
        expect(privileges[0].userId).eq("1");
        expect(privileges[0].type).eq(PrivilegeType.VIEW);
        expect(privileges[0].sid).eq("");

        await client.removeUserPrivilege("1", "");
        expect((await client.getUserPrivileges("1")).length).eq(0);
    });

    it('It should add group privileges.', async () => {
        await client.addGroup(new Group("test", []));
        expect((await client.getGroupPrivileges("test")).length).eq(0);

        const privilege = await client.setGroupPrivilege("test", "", PrivilegeType.VIEW);
        expect(privilege.name).eq("test");
        expect(privilege.type).eq(PrivilegeType.VIEW);
        expect(privilege.sid).eq("");

        const privileges = await client.getGroupPrivileges("test");
        expect(privileges.length).eq(1);
        expect(privileges[0].name).eq("test");
        expect(privileges[0].type).eq(PrivilegeType.VIEW);
        expect(privileges[0].sid).eq("");
    });

    it('It should remove user privileges.', async () => {
        await client.addGroup(new Group("test", []));
        expect((await client.getGroupPrivileges("test")).length).eq(0);

        const privilege = await client.setGroupPrivilege("test", "", PrivilegeType.VIEW);
        expect(privilege.name).eq("test");
        expect(privilege.type).eq(PrivilegeType.VIEW);
        expect(privilege.sid).eq("");

        const privileges = await client.getGroupPrivileges("test");
        expect(privileges.length).eq(1);
        expect(privileges[0].name).eq("test");
        expect(privileges[0].type).eq(PrivilegeType.VIEW);
        expect(privileges[0].sid).eq("");

        await client.removeGroupPrivilege("test", "");
        expect((await client.getGroupPrivileges("test")).length).eq(0);
    });


});