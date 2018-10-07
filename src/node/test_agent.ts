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

    let periodMillis = 10000;
    let radius = 5;

    const timer = setInterval(() => {
        let time = (new Date().getTime()) % periodMillis;
        let angle = 2 * Math.PI * time / periodMillis;
        let x = Math.cos(angle) * radius;
        let z = Math.sin(angle) * radius;
        client.refresh(x, 0, z, 0, 0, 0, 1).catch(error => { console.warn('Error refreshing.', error); });
    }, 300);

    process.on('exit', function () {
        client.close();
        clearInterval(timer);
    });
}
