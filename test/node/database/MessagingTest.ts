import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../src/common/dataspace/Encode";
import {Server} from "../../../src/common/dataspace/Server";
import {Grid} from "../../../src/common/dataspace/Grid";
import {Processor} from "../../../src/common/dataspace/Processor";
import {Client} from "../../../src/common/dataspace/Client";

describe('Test Messaging', () => {
    let server: Server;
    let client: Client;

    before(async () => {
        server = new Server('127.0.0.1', 8889, new Processor(new Grid(0, 0, 0, 1000, 100, 200)));
        server.listen();
        client = new Client("ws://127.0.0.1:8889/");
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

    it('Should send add and receive messages for two entities.', function (done) {
        client.add("1", 1, 2, 3, 4, 5, 6, 7, "d");
        client.onReceive = async function (message) {
            expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ADDED);
            client.add("2", 1, 2, 3, 4, 5, 6, 7, "d");
            client.onReceive = async function (message) {
                expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ADDED);
                client.onReceive = async function (message) {
                    expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ADDED);
                    client.onReceive = async function (message) {
                        expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ADDED);
                        done();
                    }
                }
            }
        }
    });
});