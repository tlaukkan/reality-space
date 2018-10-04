import 'mocha';

import {Server} from "../../../src/common/dataspace/Server";
import {Grid} from "../../../src/common/dataspace/Grid";
import {Processor} from "../../../src/common/dataspace/Processor";
import {Client} from "../../../src/common/dataspace/Client";

describe('Integration Test Client', () => {

    it('Should connect and disconnect client from localhost.', async () => {
        const client = new Client("ws://127.0.0.1:8889/");
        await client.connect();
        client.close();
    });

});