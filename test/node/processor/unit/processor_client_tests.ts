import 'mocha';

import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {Grid} from "../../../../src/node/processor/Grid";
import {Processor} from "../../../../src/node/processor/Processor";
import {Client} from "../../../../src/common/dataspace/Client";
import {w3cwebsocket} from "websocket";
import {Sanitizer} from "../../../../src/common/dataspace/Sanitizer";
import {FileSystemRepository} from "../../../../src/node/storage/FileSystemRepository";
import {StorageApi} from "../../../../src/node/api/StorageApi";
import {IdTokenIssuer} from "../../../../src/common/dataspace/Configuration";
import {startTestServer} from "../../util/util";

describe('Test Client', () => {
    let server: DataSpaceServer;

    before(async () => {
        server = await startTestServer(server);
    });

    after(async () => {
        await server.close();
    });

    it('Should connect and disconnect client.', async () => {
        const client = new Client("ws://127.0.0.1:8889/", "http://localhost:8889/api", "");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });

});