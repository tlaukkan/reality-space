import 'mocha';

import {RealityServer} from "../../../../src/node/server/RealityServer";
import {RealityClient} from "../../../../src/common/reality/RealityClient";
import {
    newLocalTestRealityClient,
    newLocalTestServer
} from "../../util/util";

describe('Test Reality Client Connectivity', () => {
    const server: RealityServer = newLocalTestServer();
    const client: RealityClient = newLocalTestRealityClient();

    before(async () => {
        await server.startup();
    });

    after(async () => {
        await server.close();
    });

    it('Should connect and disconnect client.', async () => {
        await client.connect();
        client.close();
    });

});