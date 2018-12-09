import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {Client} from "../../../../src/common/dataspace/Client";
import {createTestIdToken, newStorageClient, resetStorage, startTestServer} from "../../util/util";
import {w3cwebsocket} from "websocket";
import {xml2js} from "xml-js";

describe('Test Messaging', () => {
    let server: DataSpaceServer;
    let client :Client;
    const storageClient = newStorageClient();
    before(async () => {
        server = await startTestServer();
    });

    after(function() {
        server.close();
    });

    beforeEach(async () => {
        resetStorage(server);
        await storageClient.saveRootEntities('<a-entities><a-box>test</a-box></a-entities>')

        client = new Client("test", "ws://127.0.0.1:8889/", "http://localhost:8889/api", "http://localhost:8889/repository", createTestIdToken());
        client.onStoredEntityReceived = (sid: string, entityXml) => {
            console.log(sid, entityXml);
        };

        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    afterEach(async () => {
        client.close();
    });

    it('Should save and remove entity.', function (done) {

        let removeCounter = 0;
        client.add("1", 1, 2, 3, 4, 5, 6, 7, '<a-image src="dog.img"/>', Encode.AVATAR);
        client.onReceive = async function (message) {
            expect(message).equals('a|0|1|1.00|2.00|3.00|4.00|5.00|6.00|7.00|<a-image src="dog.img"/>|a|');
            client.storeEntities("<a-entities><a-box>test</a-box></a-entities>");
            client.onStoredEntityReceived = (sid: string, entityXml) => {
                console.log(sid, entityXml);
                const entity = xml2js(entityXml);
                const sid2 = (entity.elements[0].attributes as any).sid as string;
                expect(entity.elements.length).eq(1);
                expect(sid).eq(sid2);
                client.removeStoredEntities([sid]);
                client.onStoredEntityRemoved = (sid) => {
                    removeCounter++;
                    if (removeCounter == 2) {
                        done();
                    }
                }
            };
        }
    });

});