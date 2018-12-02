import 'mocha';
import {expect} from 'chai';
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {createTestIdToken, resetStorage, startTestServer} from "../../util/util";
import uuid = require("uuid");

describe('Storage API / Testing users resource ...', () => {
    let server: DataSpaceServer;
    const idToken = createTestIdToken();

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
        const response = await fetch("http://127.0.0.1:8889/api/users", { headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }});
        console.log((await response.text()));
        expect(response.status).equals(200);
    });

    it('It should get user.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/users/1", { headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }});
        expect(response.status).equals(200);
    });

    it('It should add user.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/users", { method: "POST", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }, body: '{"id":2,"name":"test-2"}'});
        expect(response.status).equals(200);
    });

    it('It should update user.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/users", { method: "POST", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }, body: '{"id":2,"name":"test-2"}'});
        expect(response.status).equals(200);
        const response2 = await fetch("http://127.0.0.1:8889/api/users/2", { method: "PUT", headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }, body: '{"id":2,"name":"test-2-3"}'});
        expect(response2.status).equals(200);
    });

});