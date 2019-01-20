import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/reality/Encode";
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {RealityClient} from "../../../../src/common/reality/RealityClient";
import {createTestIdToken, resetStorage, startLocalTestServer} from "../../util/util";
import {client, w3cwebsocket} from "websocket";
import {xml2js} from "xml-js";
import {User} from "../../../../src/common/reality/api/User";
import {
    DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CDN_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../../test";
require('isomorphic-fetch');

describe('Test Messaging', () => {
    let client = new RealityClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL, PUBLIC_TEST_CLUSTER_CDN_URL, createTestIdToken());

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
*/
    /*it('Should save entity.', function (done) {
        client.storeEntities('<a-entities><a-sphere position="-3 0 -3" scale="1 1 1" color="#BF3100"></a-sphere></a-entities>');
        done();
    });*/

});