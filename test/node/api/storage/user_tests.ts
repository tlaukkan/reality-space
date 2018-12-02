import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../../util/util";
import uuid = require("uuid");
import {StorageClient} from "../../../../src/common/dataspace/api/StorageClient";

describe('Storage API / Testing users resource ...', () => {
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

    it('It should get users.', async () => {
        const users = await client.getUsers();
        expect(users.length).eq(2);
        expect(users[0].id).eq("anonymous");
        expect(users[0].name).eq("anonymous");
        expect(users[1].id).eq("1");
        expect(users[1].name).eq("test");
    });

    it('It should get user.', async () => {
        const user = await client.getUser("1");
        expect(user!!.id).eq("1");
        expect(user!!.name).eq("test");
    });

    it('It should get non existent user.', async () => {
        const user = await client.getUser("9");
        console.log(user);
        expect(user).to.be.undefined;
    });

    it('It should add user.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/users", { method: "POST", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }, body: '{"id":2,"name":"test-2"}'});
        expect(response.status).equals(200);
    });

    it('It should update user.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/users", { method: "POST", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }, body: '{"id":2,"name":"test-2"}'});
        expect(response.status).equals(200);
        const response2 = await fetch("http://127.0.0.1:8889/api/users/2", { method: "PUT", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }, body: '{"id":2,"name":"test-2-updated"}'});
        expect(response2.status).equals(200);
    });

    it('It should remove user.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/users", { method: "POST", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }, body: '{"id":2,"name":"test-2"}'});
        expect(response.status).equals(200);
        const response2 = await fetch("http://127.0.0.1:8889/api/users/2", { method: "DELETE", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() } });
        expect(response2.status).equals(200);
    });

});