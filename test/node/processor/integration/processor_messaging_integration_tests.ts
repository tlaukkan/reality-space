import 'mocha';
require('isomorphic-fetch');
import { expect } from 'chai';
import {Encode} from "../../../../src/common/reality/Encode";
import {RealityClient} from "../../../../src/common/reality/RealityClient";
import {w3cwebsocket} from "websocket";
import {
    DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_CDN_URL,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../../test";
import {createTestIdToken} from "../../util/util";

describe('Integration Test Messaging', () => {
    let client: RealityClient;

    before(async () => {
        client = new RealityClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL, PUBLIC_TEST_CLUSTER_STORAGE_URL, PUBLIC_TEST_CLUSTER_CDN_URL, createTestIdToken());
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    after(function() {
        client.close();
    });

    it('Should send add and receive messages.', function (done) {
        client.add("1", 1, 2, 3, 4, 5, 6, 7, "<a-box/>", Encode.AVATAR);
        client.onReceive = async function (message) {
            const id = message.split(Encode.SEPARATOR)[2];
            if (id!="1") {
                return;
            }

            console.log(message);
            const index = message.split(Encode.SEPARATOR)[1];
            expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ADDED);
            client.update("1", 1, 2, 3, 4, 5, 6, 7);
            client.onReceive = async function (message) {
                if (message.split(Encode.SEPARATOR)[1] != index) { return; }
                expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.UPDATED);
                client.describe("1", "<a-box/>");
                client.onReceive = async function (message) {
                    if (message.split(Encode.SEPARATOR)[1] != index) { return; }
                    expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.DESCRIBED);
                    client.act("1", "a", "b");
                    client.onReceive = async function (message) {
                        if (message.split(Encode.SEPARATOR)[1] != index) { return; }
                        expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.ACTED);
                        client.remove("1");
                        client.onReceive = async function (message) {
                            if (message.split(Encode.SEPARATOR)[1] != index) { return; }
                            expect(message.split(Encode.SEPARATOR)[0]).equals(Encode.REMOVED);
                            done();
                        }
                    }
                }
            }
        }
    });

});