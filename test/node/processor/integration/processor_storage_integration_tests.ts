import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {RealityClient} from "../../../../src/common/dataspace/RealityClient";
import {createTestIdToken, resetStorage, startLocalTestServer} from "../../util/util";
import {client, w3cwebsocket} from "websocket";
import {xml2js} from "xml-js";
import {User} from "../../../../src/common/dataspace/api/User";
require('isomorphic-fetch');

describe('Test Messaging', () => {
    let server: DataSpaceServer;
    let client = new RealityClient("default", "0-0-0", "wws://aframe-dataspace-0-0-0.herokuapp.com/", "https://aframe-dataspace-storage-eu.herokuapp.com/api", "http://dataspace-eu.s3-website.eu-central-1.amazonaws.com", "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidGVzdC1hZG1pbiIsImp0aSI6IjhlYzg5ODA5LTM1ZjYtNGM4ZS04NWJjLWM3NTNjMDZjODk3OSIsIm5hbWUiOiJUZXN0IEFkbWluIiwiZXhwIjo0Njk3OTM4ODUzLCJpYXQiOjE1NDQzMzg4NTN9.EZUj65lAwbNE9iUeXZLNWHlRq23OK5iA8Vul51abuejHDuc6IhuIZCswsUIdPxHGkOsvy6FSm2su5ePpIs1xO1gwQ_u-Nc_Po2BNBqwqIs-sDn9qNVD13Nd5W7_SzxeEWIm7pQft6YP9uvbVV8d-8Nbz8U8KYA5DPLZGodsCQotRL1aBZPbQdc6QB9-rMr2YqpXPQGxAQjjArnl97QPRTig8UxfA9zQWecdNYRXsxtfNFlAnM76uPjN00er4omCxGrWG8vhAAiIQDchwQ7IndRnTyhjybNyWLS2siONFXQ7azfcPa17cM-s_mRfzw4nGZnhEpbYGz1VfVylFC4ivyg");

    before(async () => {
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    after(function() {
        client.close();
    });

    beforeEach(async () => {
    });


/*
    it('Should add test admin as first user in new cluster.', async function () {
        await client.storageClient.addUser(new User("test-admin", "Test Admin", []));
        await client.storageClient.addUser(new User("test-modifier", "Test Modifier", []));
        await client.storageClient.addGroupMember("modifiers", "test-modifier");
        await client.storageClient.addUser(new User("test-user", "Test User", []));
        await client.storageClient.addGroupMember("users", "test-user");
        await client.storageClient.addUser(new User("test-viewer", "Test Viewer", []));
        await client.storageClient.addGroupMember("viewers", "test-viewer");
    });

    it('Should get users.', async function () {
        console.log(await client.storageClient.getUsers());
    });

    it('Should save entity.', function (done) {
        client.add("1", 0, 0, 0, 0, 0, 0, 1, '<a-box/>', Encode.AVATAR);
        client.onReceive = async function (message) {
            client.onReceive = async function (message) {}
            client.storeEntities('<a-entities><a-sphere position="-3 0 -3" scale="1 1 1" color="#BF3100"></a-sphere></a-entities>');
            client.onStoredEntityReceived = (entityXml) => {
                const entity = xml2js(entityXml);
                expect(entity.elements.length).eq(1);
                done();
                //client.removeStoredEntities([(entity.elements[0].attributes as any).sid as string]);
                //client.onStoredEntityRemoved = (sid) => {
                //    done();
                //}
            };
        }
    });
*/

});