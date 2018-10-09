import 'mocha';

import {Server} from "../../../../src/common/dataspace/Server";
import {Grid} from "../../../../src/common/dataspace/Grid";
import {Processor} from "../../../../src/common/dataspace/Processor";
import {Sanitizer} from "../../../../src/common/dataspace/Sanitizer";

describe('Test Server', () => {
    let server: Server;

    before(async () => {
        server = new Server('127.0.0.1', 8889, new Processor(new Grid(0, 0, 0, 1000, 100, 200), new Sanitizer("", "", "")));
    });

    after(function() {
        server.close();
    });

    it('Should listen and close server.', async () => {
        server.listen();
    });

});