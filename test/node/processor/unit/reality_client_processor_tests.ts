import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {RealityClient} from "../../../../src/common/dataspace/RealityClient";
import {createTestIdToken, startLocalTestServer, waitOnCondition} from "../../util/util";
import uuid = require("uuid");
import {w3cwebsocket} from "websocket";

describe('Test Messaging', () => {
    let server: RealityServer;
    let client: RealityClient;

    before(async () => {
        server = await startLocalTestServer();
        client = new RealityClient("default", "test", "ws://127.0.0.1:8889/", "http://localhost:8889/api", "http://localhost:8889/api/", createTestIdToken());
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
                    client.act("1", "a", "b");
                    client.onReceive = async function (message) {
                        expect(message).equals("c|0|a|b|");
                        client.notify("x", "y");
                        client.onReceive = async function (message) {
                            expect(message).equals("n|x|y|");
                            client.remove("1");
                            client.onReceive = async function (message) {
                                expect(message).equals("r|0|1|");
                                done();
                            }
                        }
                    }
                }
            }
        }
    });

    it('Should send add and receive messages for multiple clients.', async () => {
        const n = 3;
        const clients: Array<RealityClient> = [];
        const entityIds: Array<string> = [];
        let c = 0;
        let a = 0;

        const startMillis = new Date().getTime();
        for (let i = 0; i < n; i++) {
            const client = new RealityClient("default", "test", "ws://127.0.0.1:8889/", "http://localhost:8889/api", "http://localhost:8889/api/", createTestIdToken());
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