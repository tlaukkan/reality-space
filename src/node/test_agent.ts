import {ClusterClient} from "..";
import {w3cwebsocket} from "websocket";
import uuid = require("uuid");

start()
    .then()
    .catch(e => console.log('error starting storage server: ', e));

async function start() {
    const id = uuid.v4();
    const client: ClusterClient = new ClusterClient("https://cdn.rawgit.com/tlaukkan/aframe-dataspace/f197b55b/defaul-configuration.json", id, 0, 0, 0, 0, 0, 0, 1, "<a-box></a-box>");
    client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
    await client.connect();

    const timer = setInterval(async () => {
        let time = new Date().getTime();
        let y = time % 10;
        await client.refresh(0, y, 0, 0, 0, 0, 1);
    }, 0.3);

    process.on('exit', function () {
        client.close();
        clearInterval(timer);
    });
}
