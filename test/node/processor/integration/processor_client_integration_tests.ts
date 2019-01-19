import 'mocha';
require('isomorphic-fetch');
import {RealityClient} from "../../../../src/common/dataspace/RealityClient";
import {w3cwebsocket} from "websocket";
import {
    DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CDN_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_100_NAME, PUBLIC_TEST_CLUSTER_PROCESSOR_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../../test";
import {createTestIdToken} from "../../util/util";

describe('Integration Test Client', () => {

    /*it('Should connect client to localhost.', async () => {
        const client = new Client("test", "ws://127.0.0.1:8889/", "http://localhost:8889/api", "http://localhost:8889/repository", "");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });*/

    it('Should connect client to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const client = new RealityClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL, PUBLIC_TEST_CLUSTER_CDN_URL, createTestIdToken());
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });

    it('Should connect client to aframe-dataspace-0-0-100.herokuapp.com.', async () => {
        const client = new RealityClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_100_NAME, PUBLIC_TEST_CLUSTER_PROCESSOR_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL, PUBLIC_TEST_CLUSTER_CDN_URL, createTestIdToken());
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });

});