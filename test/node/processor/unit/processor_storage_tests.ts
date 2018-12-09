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
        client.onStoredRootEntityReceived = (sid: string, entityXml) => {
            console.log(sid, entityXml);
        };

        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    afterEach(async () => {
        client.close();
    });

    it('Should save and remove entity.', function (done) {
        client.add("1", 1, 2, 3, 4, 5, 6, 7, '<a-image src="dog.img"/>', Encode.AVATAR);
        client.onReceive = async function (message) {
            expect(message).equals('a|0|1|1.00|2.00|3.00|4.00|5.00|6.00|7.00|<a-image src="dog.img"/>|a|');
            client.onStoredRootEntityReceived = (sid: string, entityXml) => {
                //console.log(sid, entityXml);
                expect(sid).eq(((xml2js(entityXml).elements[0].attributes as any).sid as string));
                client.storeChildEntities(sid, "<a-entities><a-box>test</a-box></a-entities>");

                client.onStoredChildEntityReceived = (parentSid, childSid, entityXml) => {
                    expect(parentSid).eq(sid);
                    //console.log(childSid, entityXml);
                    expect(childSid).eq((xml2js(entityXml).elements[0].attributes as any).sid as string);
                    client.removeStoredEntities([childSid]);
                    client.onStoredEntityRemoved = (childSid2) => {
                        expect(childSid2).eq(childSid);
                         done();
                    }
                };
            }
        }
    });

});