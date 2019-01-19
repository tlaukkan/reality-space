import {RealityClient} from "../../../../src/common/dataspace/RealityClient";

describe('Integration Test Single Client', () => {

    it('Should connect client to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const client = new RealityClient("default", "0-0-0", "wss://aframe-dataspace-0-0-0.herokuapp.com/", "https://aframe-dataspace-storage-eu.herokuapp.com/api", "http://dataspace-eu.s3-website.eu-central-1.amazonaws.com/", "");
        await client.connect();
        client.close();
    });

});