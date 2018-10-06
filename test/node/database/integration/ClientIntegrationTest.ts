import 'mocha';

import {Client} from "../../../../src/common/dataspace/Client";

describe('Integration Test Client', () => {

    it('Should connect client to localhost.', async () => {
        const client = new Client("ws://127.0.0.1:8889/");
        await client.connect();
        client.close();
    });

    it('Should connect client to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const client = new Client("wss://aframe-dataspace-0-0-0.herokuapp.com/");
        await client.connect();
        client.close();
    });

    it('Should connect client to aframe-dataspace-0-0-100.herokuapp.com.', async () => {
        const client = new Client("wss://aframe-dataspace-0-0-0.herokuapp.com/");
        await client.connect();
        client.close();
    });

});