import 'mocha';
import { expect } from 'chai';
import {Server} from "../../../../src/common/dataspace/Server";
import {Grid} from "../../../../src/common/dataspace/Grid";
import {Processor} from "../../../../src/common/dataspace/Processor";
import {Sanitizer} from "../../../../src/common/dataspace/Sanitizer";
import {FileSystemRepository} from "../../../../src/node/storage/repository/FileSystemRepository";
import {StorageRestService} from "../../../../src/node/storage/StorageRestService";
import {ClusterConfiguration, IdTokenIssuer} from "../../../../src/common/dataspace/Configuration";

describe('Test Server', () => {
    let server: Server;

    before(async () => {
        const sanitizer = new Sanitizer("a-scene-fragment,a-scene,a-box,a-circle,a-collada-model,a-cone,a-curvedimage,a-cylinder,a-dodecahedron,a-gltf-model,a-icosahedron,a-image,a-obj-model,a-octahedron,a-plane,a-ring,a-sound,a-sphere,a-tetrahedron,a-text,a-torus-knot,a-torus,a-triangle",
            "sid,scale,src,geometry,material,position,rotation,sound,text",
            "[^\\w\\s\\.:;]");
        const processor = new Processor(new Grid(0, 0, 0, 1000, 100, 200), sanitizer);
        const repository = new FileSystemRepository();
        const storageRestService = new StorageRestService(repository, sanitizer, [new IdTokenIssuer("test-issuer", "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==")]);
        await storageRestService.startup();
        server = new Server('127.0.0.1', 8889, processor, storageRestService);
        server.listen();
    });

    after(function() {
        server.close();
    });

    it('It should test health check.', async () => {
        const response = await fetch("http://127.0.0.1:8889/health-check");
        expect(response.status).equals(200);
        /*if (response.status >= 400) {
            throw new Error("Bad response from server");
        }
        const responseText = await (response.text());
        return JSON.parse(responseText) as ClusterConfiguration;*/
    });

});