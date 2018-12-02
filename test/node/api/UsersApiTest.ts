import 'mocha';
import {expect} from 'chai';
import {Server} from "../../../src/node/server/Server";
import {createTestIdToken, startTestServer} from "../util/util";
import uuid = require("uuid");

describe('Users API Test.', () => {
    let server: Server;
    const idToken = createTestIdToken();

    before(async () => {
        server = await startTestServer(server);
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

});