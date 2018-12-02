import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {Server} from "../../../../src/node/server/Server";
import {Grid} from "../../../../src/common/dataspace/Grid";
import {Processor} from "../../../../src/common/dataspace/Processor";
import {Client} from "../../../../src/common/dataspace/Client";
import {waitOnCondition} from "../../util/util";
import uuid = require("uuid");
import {w3cwebsocket} from "websocket";
import {Sanitizer} from "../../../../src/common/dataspace/Sanitizer";
import {FileSystemRepository} from "../../../../src/node/storage/repository/FileSystemRepository";
import {StorageRestService} from "../../../../src/node/api/StorageRestService";
import {IdTokenIssuer} from "../../../../src/common/dataspace/Configuration";

describe('Test Messaging', () => {
    let server: Server;
    let client: Client;

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
        client = new Client("ws://127.0.0.1:8889/");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    after(function() {
        client.close();
        server.close();
    });

    it('Should send add and receive messages.', function (done) {
        client.add("1", 1, 2, 3, 4, 5, 6, 7, '<a-image src="dog.img"/>', Encode.AVATAR);
        client.onReceive = async function (message) {
            expect(message).equals('a|0|1|1.00|2.00|3.00|4.00|5.00|6.00|7.00|<a-image src="dog.img"/>|a|');
            client.update("1", 1, 2, 3, 4, 5, 6, 7);
            client.onReceive = async function (message) {
                expect(message).equals("u|0|1.00|2.00|3.00|4.00|5.00|6.00|7.00|");
                client.describe("1", "<a-dog/>");
                client.onReceive = async function (message) {
                    expect(message).equals("d|0||");
                    client.act("1", "a");
                    client.onReceive = async function (message) {
                        expect(message).equals("c|0|a|");
                        client.remove("1");
                        client.onReceive = async function (message) {
                            expect(message).equals("r|0|1|");
                            done();
                        }
                    }
                }
            }
        }
    });

    it('Should send add and receive messages for multiple clients.', async () => {
        const n = 3;
        const clients: Array<Client> = [];
        const entityIds: Array<string> = [];
        let c = 0;
        let a = 0;

        const startMillis = new Date().getTime();
        for (let i = 0; i < n; i++) {
            const client = new Client("ws://127.0.0.1:8889/");
            client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};

            clients.push(client);
            entityIds.push(uuid.v4());
            await clients[i].connect();
            clients[i].onReceive = async function (message) {
                c++;
            };
        }

        clients[2].onReceive = async function (message) {
            c++;
            if (message.split(Encode.SEPARATOR)[0]===Encode.ADDED) {
                a++;
                console.log(a + ") " + message);
            }
        };

        for (let i = 0; i < n; i++) {
            await clients[i].add(entityIds[i], 1, 2, 3, 4, 5, 6, 7, "<a-box/>", Encode.AVATAR);
        }

        await waitOnCondition(() => { return a >= n});

        for (let i = 0; i < n; i++) {
            clients[i].close();
        }

        const endMillis = new Date().getTime();
        const timeMillis = endMillis - startMillis;

        console.log("time spent: " + timeMillis + " ms.")
        console.log("receive throughput: " + (c / (timeMillis / 1000)) + " messages/s.")
    });
});