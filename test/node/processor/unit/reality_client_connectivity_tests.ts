import 'mocha';

import {RealityServer} from "../../../../src/node/server/RealityServer";
import {RealityClient} from "../../../../src/common/reality/RealityClient";
import {
    newLocalTestRealityClient, newLocalTestRealityClientForGivenSpace,
    newLocalTestServer
} from "../../util/util";
import {expect} from "chai";
import {StorageRequestManager} from "../../../../src/node/storage/StorageRequestManager";

describe('Test Reality Client Connectivity', () => {
    const server: RealityServer = newLocalTestServer();

    before(async () => {
        await server.startup();
    });

    after(async () => {
        await server.close();
    });

    it('Should connect and disconnect client.', async () => {
        const client: RealityClient = newLocalTestRealityClient();
        await client.connect();
        client.close();
    });

    it('Should connect and disconnect client to dynamic space and clean up after disconnect.', async () => {
        expect(server.processorManager!!.processors.has("dynamic-connection-test")).false;
        expect(server.storageManager!!.storages.has("dynamic-connection-test")).false;

        {
            const client: RealityClient = newLocalTestRealityClientForGivenSpace("dynamic-connection-test");
            client.loadEntities = false;
            await client.connect();
            expect(server.processorManager!!.processors.has("dynamic-connection-test")).true;
            expect(server.storageManager!!.storages.has("dynamic-connection-test")).true;
            expect(server.processorManager!!.processors.get("dynamic-connection-test")!!.size).eq(1);
            expect(server.storageManager!!.storages.get("dynamic-connection-test")!!.size).eq(1);

            server.storageManager!!.storages.get("dynamic-connection-test")!!.get("test")!!.lastAccessTimeMillis = new Date().getTime() - StorageRequestManager.DYNAMIC_STRORAGE_INACTIVITY_CLEANUP_TIME_MILLIS - 1;

            client.close();
        }

        {
            const client: RealityClient = newLocalTestRealityClient();
            await client.connect();
            client.close();
        }

        expect(server.processorManager!!.processors.has("dynamic-connection-test")).false;
        expect(server.storageManager!!.storages.has("dynamic-connection-test")).false;
    });


});