import 'mocha';

import {RealityServer} from "../../../../src/node/server/RealityServer";
import {startLocalTestServer} from "../../util/util";

describe('Test Server', () => {
    let server: RealityServer;

    after(async () => {
        await server.close();
    });

    it('Should listen and close server.', async () => {
        server = await startLocalTestServer();
    });

});