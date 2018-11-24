import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {Client} from "../../../../src/common/dataspace/Client";
import {w3cwebsocket} from "websocket";

describe('Integration Test Messaging', () => {
    let client: Client;

    before(async () => {
        client = new Client("wws://aframe-dataspace-0-0-0.herokuapp.com/");
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    after(function() {
        client.close();
    });

    it('Should send add and receive messages.', function (done) {
        client.add("1", 1, 2, 3, 4, 5, 6, 7, "<a-box/>", Encode.AVATAR);
        client.onReceive = async function (message) {
            expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ADDED);
            client.update("1", 1, 2, 3, 4, 5, 6, 7);
            client.onReceive = async function (message) {
                expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.UPDATED);
                client.describe("1", "<a-box/>");
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

});