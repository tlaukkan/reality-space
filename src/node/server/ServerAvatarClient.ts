import {w3cwebsocket} from "websocket";
import {quat, vec3} from "@tlaukkan/tsm";
import uuid = require("uuid");
import {ClusterClient} from "../../common/reality/ClusterClient";

export class ServerAvatarClient {

    clusterConfigurationUrl: string;

    constructor(clusterConfigurationUrl: string) {
        this.clusterConfigurationUrl = clusterConfigurationUrl;
    }

    async start() {
        const id = uuid.v4();
        const client: ClusterClient = new ClusterClient(this.clusterConfigurationUrl, "default", id, 0, 0, 0, 0, 0, 0, 1, "<a-dodecahedron scale='0.5 0.5 0.5'></a-dodecahedron>", "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidW5pdC10ZXN0LWFkbWluaXN0cmF0b3IiLCJqdGkiOiI4ZGYwODA0Yi1jMjQ4LTQ2YjgtYjEwYy00ZDYwMWVjMTNkNmUiLCJuYW1lIjoidW5pdC10ZXN0LWFkbWluaXN0cmF0b3IiLCJncm91cHMiOiJhZG1pbmlzdHJhdG9ycyIsImV4cCI6MTU3OTQ2OTQwNywiaWF0IjoxNTQ3OTMzNDA3fQ.hgB1yT99vFflqzsNd0of0edTVqlXzrO4ATvmP2ufcMVJNOddW3GMNoFsy4TWd0Q0YGfo5kJd6iewjORKhhWEuLh0F2cvi-VyPZe6KlViHnpnl8c8aj0weF4jjiCeDYE3Dy0ZfB8PjDVYSQzU1QhG9WPBHQ8ZG5iwPO4LRbhZX1rj8fA0zsR03mr7NDrUtfQjW90T0Rark83ZtoQrwfSIGVAC0hHk0Kn8LbfHKcutpe1r7JmO2cTell3w08tVp_eBUvu9RElrRXEo6Q6TedglJlgQfMfzkYum-NyIj_OYrEeoclAVVV_X1myXDlqwxUH8Qk4K_tWoVq3otqbWxe2AXw");
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

}