import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {newLocalTestStorageClient, resetStorage, startLocalTestServer} from "../../util/util";
import {PrivilegeType} from "../../../../src/common/reality/api/PrivilegeType";
import {Group} from "../../../../src/common/reality/api/Group";

describe('Storage API / Testing privileges ...', () => {
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