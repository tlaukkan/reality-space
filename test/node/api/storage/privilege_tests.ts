import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../../util/util";
import {StorageClient} from "../../../../src/common/dataspace/api/StorageClient";
import {User} from "../../../../src/common/dataspace/api/User";
import {PrivilegeType} from "../../../../src/common/dataspace/api/PrivilegeType";

describe('Storage API / Testing privileges ...', () => {
    let server: DataSpaceServer;
    const idToken = createTestIdToken();
    const client = new StorageClient("http://127.0.0.1:8889/api", idToken);

    before(async () => {
        server = await startTestServer(server);
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(function() {
        server.close();
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


});