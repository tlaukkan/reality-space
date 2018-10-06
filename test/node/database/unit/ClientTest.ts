import 'mocha';

import {Server} from "../../../../src/common/dataspace/Server";
import {Grid} from "../../../../src/common/dataspace/Grid";
import {Processor} from "../../../../src/common/dataspace/Processor";
import {Client} from "../../../../src/common/dataspace/Client";

describe('Test Client', () => {
    let server: Server;

    before(function() {
        server = new Server('127.0.0.1', 8889, new Processor(new Grid(0, 0, 0, 1000, 100, 200)));
        server.listen();
    });

    after(function() {
        server.close();
    });

    it('Should connect and disconnect client.', async () => {
        const client = new Client("ws://127.0.0.1:8889/");
        await client.connect();
        client.close();
    });

});