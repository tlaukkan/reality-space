import 'mocha';
import {expect} from 'chai';
import {Server} from "../../../src/node/server/Server";
import {createTestIdToken, startTestServer} from "../util/util";
import uuid = require("uuid");

describe('Storage REST API general tests..', () => {
    let server: Server;
    const idToken = createTestIdToken();

    before(async () => {
        server = await startTestServer(server);
    });

    after(function() {
        server.close();
    });

    it('It should test health check.', async () => {
        const response = await fetch("http://127.0.0.1:8889/health");
        expect(response.status).equals(200);
    });

    it('It should call API without request ID header and authorization header and return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/regions/0-0-0/users", { headers: { } });
        expect(response.status).equals(401);
    });

    it('It should call API without request ID header and return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/regions/0-0-0/users", { headers: { "Authorization": "Bearer " + idToken } });
        expect(response.status).equals(401);
    });

    it('It should call API without authorization header and return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/regions/0-0-0/users", { headers: { "Request-ID": uuid.v4() } });
        expect(response.status).equals(401);
    });

    it('It should call API without Bearer in authorization header return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/regions/0-0-0/users", { headers: { "Authorization": "s", "Request-ID": uuid.v4()}});
        expect(response.status).equals(401);
    });

    it('It should call API without correctly formatted token in authorization header return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/regions/0-0-0/users", { headers: { "Authorization": "Bearer doh", "Request-ID": uuid.v4()}});
        expect(response.status).equals(401);
    });

    it('It should call API with non existent URL path and return 404.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/non-existent", { headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4()}});
        expect(response.status).equals(404);
    });

    it('It should call API with unsupported method and return 405.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/regions/0-0-0/users", { method: 'post', headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }});
        expect(response.status).equals(405);
    });

    it('It should get users.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/regions/0-0-0/users", { headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }});
        expect(response.status).equals(200);
    });

});