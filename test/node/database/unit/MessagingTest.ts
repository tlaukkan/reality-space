import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {Server} from "../../../../src/common/dataspace/Server";
import {Grid} from "../../../../src/common/dataspace/Grid";
import {Processor} from "../../../../src/common/dataspace/Processor";
import {Client} from "../../../../src/common/dataspace/Client";
import {waitOnCondition} from "./../util";
import uuid = require("uuid");
import {w3cwebsocket} from "websocket";

describe('Test Messaging', () => {
    let server: Server;
    let client: Client;

    before(async () => {
        server = new Server('127.0.0.1', 8889, new Processor(new Grid(0, 0, 0, 1000, 100, 200)));
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
        client.add("1", 1, 2, 3, 4, 5, 6, 7, "d");
        client.onReceive = async function (message) {
            expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ADDED);
            client.update("1", 1, 2, 3, 4, 5, 6, 7);
            client.onReceive = async function (message) {
                expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.UPDATED);
                client.describe("1", "d");
                client.onReceive = async function (message) {
                    expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.DESCRIBED);
                    client.act("1", "a");
                    client.onReceive = async function (message) {
                        expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ACTED);
                        client.remove("1");
                        client.onReceive = async function (message) {
                            expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.REMOVED);
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
            await clients[i].add(entityIds[i], 1, 2, 3, 4, 5, 6, 7, "d");
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