import 'mocha';

import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {Grid} from "../../../../src/node/processor/Grid";
import {Processor} from "../../../../src/node/processor/Processor";
import {Sanitizer} from "../../../../src/common/dataspace/Sanitizer";
import {FileSystemRepository} from "../../../../src/node/storage/FileSystemRepository";
import {StorageApi} from "../../../../src/node/api/StorageApi";
import {IdTokenIssuer} from "../../../../src/common/dataspace/Configuration";
import {startTestServer} from "../../util/util";

describe('Test Server', () => {
    let server: DataSpaceServer;

    after(async () => {
        await server.close();
    });

    it('Should listen and close server.', async () => {
        server = await startTestServer();
    });

});