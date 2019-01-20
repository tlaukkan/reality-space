import 'mocha';

import {RealityServer} from "../../../../src/node/server/RealityServer";
import {RealityClient} from "../../../../src/common/reality/RealityClient";
import {
    newLocalTestRealityClientWithoutAccessRights,
    newLocalTestServer, resetStorage
} from "../../util/util";
import {expect} from "chai";

describe('Test Reality Client Connectivity', () => {
    const server: RealityServer = newLocalTestServer();
    const client: RealityClient = newLocalTestRealityClientWithoutAccessRights();

    before(async () => {
        await server.startup();
    });

    after(async () => {
        await server.close();
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    it('Should fail to connect.', async () => {
        let errorMessage = "";
        try {
            await client.connect();
        } catch (error) {
            errorMessage = error.message;
        }
        expect(errorMessage).equals("access denied: 403");
    });

});