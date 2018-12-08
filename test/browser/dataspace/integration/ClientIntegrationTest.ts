import {Client} from "../../../../src/common/dataspace/Client";

describe('Integration Test Single Client', () => {

    it('Should connect client to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const client = new Client("test", "ws://127.0.0.1:8889/", "http://localhost:8889/api", "http://localhost:8889/repository", "");
        await client.connect();
        client.close();
    });

});