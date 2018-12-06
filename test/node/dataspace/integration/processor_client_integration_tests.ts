import 'mocha';

import {Client} from "../../../../src/common/dataspace/Client";
import {w3cwebsocket} from "websocket";

describe('Integration Test Client', () => {

    /*it('Should connect client to localhost.', async () => {
        const client = new Client("ws://127.0.0.1:8889/");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });*/

    it('Should connect client to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const client = new Client("wss://aframe-dataspace-0-0-0.herokuapp.com/");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });

    it('Should connect client to aframe-dataspace-0-0-100.herokuapp.com.', async () => {
        const client = new Client("wss://aframe-dataspace-0-0-100.herokuapp.com/");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });

});