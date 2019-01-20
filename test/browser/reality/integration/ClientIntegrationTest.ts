import {RealityClient} from "../../../../src/common/reality/RealityClient";
import {
    DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CDN_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../../test";
import {createTestIdToken} from "../../browser";

describe('Integration Test Single Client', () => {

    it('Should connect client to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const client = new RealityClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL, PUBLIC_TEST_CLUSTER_CDN_URL, createTestIdToken());
        await client.connect();
        client.close();
    });

});