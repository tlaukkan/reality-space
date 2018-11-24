import 'mocha';

import {Server} from "../../../../src/node/server/Server";
import {Grid} from "../../../../src/common/dataspace/Grid";
import {Processor} from "../../../../src/common/dataspace/Processor";
import {Client} from "../../../../src/common/dataspace/Client";
import {w3cwebsocket} from "websocket";
import {Sanitizer} from "../../../../src/common/dataspace/Sanitizer";
import {FileSystemRepository} from "../../../../src/node/storage/repository/FileSystemRepository";
import {StorageRestService} from "../../../../src/node/api/StorageRestService";
import {IdTokenIssuer} from "../../../../src/common/dataspace/Configuration";

describe('Test Client', () => {
    let server: Server;

    before(async () => {
        const sanitizer = new Sanitizer("a-scene-fragment,a-scene,a-box,a-circle,a-collada-model,a-cone,a-curvedimage,a-cylinder,a-dodecahedron,a-gltf-model,a-icosahedron,a-image,a-obj-model,a-octahedron,a-plane,a-ring,a-sound,a-sphere,a-tetrahedron,a-text,a-torus-knot,a-torus,a-triangle",
            "sid,scale,src,geometry,material,position,rotation,sound,text",
            "[^\\w\\s\\.:;]");
        const processor = new Processor(new Grid(0, 0, 0, 1000, 100, 200), sanitizer);
        const repository = new FileSystemRepository();
        const storageRestService = new StorageRestService(repository, sanitizer);
        await storageRestService.startup();
        server = new Server('127.0.0.1', 8889, processor, storageRestService, [new IdTokenIssuer("test-issuer", "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==")]);
        server.listen();
    });

    after(function() {
        server.close();
    });

    it('Should connect and disconnect client.', async () => {
        const client = new Client("ws://127.0.0.1:8889/");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
        client.close();
    });

});