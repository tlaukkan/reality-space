import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {RealityClient} from "../../../../src/common/dataspace/RealityClient";
import {
    newLocalTestStorageClient,
    newLocalTestRealityClient,
    resetStorage,
    newLocalTestServer
} from "../../util/util";
import {xml2js} from "xml-js";

describe('Reality client storage test.', () => {

    const server: DataSpaceServer = newLocalTestServer();
    const storageClient = newLocalTestStorageClient();
    const client :RealityClient = newLocalTestRealityClient();

    let sid: string = "";
    let xml: string = "";

    before(async () => {
        await server.startup();
    });

    after(async () => {
        await server.close();
    });

    beforeEach(async () => {
        resetStorage(server);

        await storageClient.saveRootEntities('<a-entities><a-box>test</a-box></a-entities>')

        //client = new RealityClient("default", "test", "ws://127.0.0.1:8889/", "http://localhost:8889/api/", "http://localhost:8889/api/", createTestIdToken());
        //client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};

        // Lets store the a-box sid and xml on initial load of stored entities.
        client.onStoredRootEntityReceived = (entitySid: string, entityXml) => {
            sid = entitySid;
            xml = entityXml;
            console.log(entitySid, entityXml);
        };


        await client.connect();
    });

    afterEach(async () => {
        client.close();
    });

    it('Should save and remove entity.', function (done) {

        client.add("1", 1, 2, 3, 4, 5, 6, 7, '<a-image src="dog.img"/>', Encode.AVATAR);

        client.onReceive = async function (message) {
            expect(message).equals('a|0|1|1.00|2.00|3.00|4.00|5.00|6.00|7.00|<a-image src="dog.img"/>|a|');

            expect(sid).eq(((xml2js(xml).elements[0].attributes as any).sid as string));

            client.storeChildEntities(sid, "<a-entities><a-sphere>test2</a-sphere></a-entities>");

            client.onStoredChildEntityReceived = (parentSid, childSid, entityXml) => {
                const childEntity = xml2js(entityXml).elements[0];
                expect(parentSid).eq(sid);
                expect("a-sphere").eq(childEntity.name);
                expect(childSid).eq((childEntity.attributes as any).sid as string);
                client.removeStoredEntities([childSid]);
                client.onStoredEntityRemoved = (childSid2) => {
                    expect(childSid2).eq(childSid);
                    done();
                }
            };
        };


    });

});