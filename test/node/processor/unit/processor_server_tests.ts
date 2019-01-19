import 'mocha';

import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {startLocalTestServer} from "../../util/util";

describe('Test Server', () => {
    let server: DataSpaceServer;

    after(async () => {
        await server.close();
    });

    it('Should listen and close server.', async () => {
        server = await startLocalTestServer();
    });

});