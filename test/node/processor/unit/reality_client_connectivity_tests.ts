import 'mocha';

import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {RealityClient} from "../../../../src/common/dataspace/RealityClient";
import {
    newLocalTestRealityClient,
    newLocalTestServer
} from "../../util/util";

describe('Test Reality Client Connectivity', () => {
    const server: DataSpaceServer = newLocalTestServer();
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