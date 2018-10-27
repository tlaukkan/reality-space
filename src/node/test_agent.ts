import {ClusterClient} from "..";
import {w3cwebsocket} from "websocket";
import {quat} from "@tlaukkan/tsm";
import {vec3} from "@tlaukkan/tsm";
import uuid = require("uuid");

start()
    .then()
    .catch(e => console.log('error starting storage server: ', e));

async function start() {
    const id = uuid.v4();
    const client: ClusterClient = new ClusterClient("https://cdn.rawgit.com/tlaukkan/aframe-dataspace/f197b55b/defaul-configuration.json", id, 0, 0, 0, 0, 0, 0, 1, "<a-dodecahedron scale='0.5 0.5 0.5'></a-dodecahedron>");
    client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
    await client.connect();

    let periodMillis = 10000;
    let radius = 2;

    const timer = setInterval(() => {
        let time = (new Date().getTime()) % periodMillis;
        let angle = 2 * Math.PI * time / periodMillis;
        let x = Math.cos(angle) * radius;
        let z = Math.sin(angle) * radius;
        var rAxis = new vec3([0, 1, 0]);
        var q1 = quat.fromAxisAngle(rAxis, 3 * angle).normalize();
        client.refresh(x, 4, z, q1.x, q1.y, q1.z, q1.w).catch(error => { console.warn('Error refreshing.', error); });
    }, 300);

    process.on('exit', function () {
        client.close();
        clearInterval(timer);
    });
}
