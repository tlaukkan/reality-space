import 'mocha';

import {RealityClient} from "../../../../src/common/reality/RealityClient";
import uuid = require("uuid");
import {Encode} from "../../../../src/common/reality/Encode";
import {createTestIdToken, waitOnCondition} from "../../util/util";
import {w3cwebsocket} from "websocket";
import {
    DEFAULT_DIMENSION,
    PUBLIC_TEST_CLUSTER_CDN_URL, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME,
    PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL,
    PUBLIC_TEST_CLUSTER_STORAGE_URL
} from "../../../test";

describe('Performance Test Server', () => {

    it('Should performance test server.', async () => {
        const url = PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_URL;
        const apiUrl = PUBLIC_TEST_CLUSTER_STORAGE_URL;
        const assetUrl = PUBLIC_TEST_CLUSTER_CDN_URL;

        //const url = "ws://127.0.0.1:8889/";
        const numberOfClients = 30;
        const numberOfUpdateRounds = 10;

        const clients: Array<RealityClient> = [];
        const entityIds: Array<string> = [];

        for (let i = 0; i < numberOfClients; i++) {
            const client = new RealityClient(DEFAULT_DIMENSION, PUBLIC_TEST_CLUSTER_PROCESSOR_0_0_0_NAME, url, apiUrl, assetUrl, createTestIdToken());
            client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
            clients.push(client);
            entityIds.push(uuid.v4());
            await clients[i].connect();
        }

        let a = 0;
        let messageCount = 0;
        let byteCount = 0;

        for (let i = 0; i < numberOfClients; i++) {
            clients[i].onReceive = async function (message) {
                if (message.split(Encode.SEPARATOR)[0]===Encode.UPDATED) {
                    messageCount++;
                    byteCount+=message.length;
                }
            };
        }

        clients[numberOfClients-1].onReceive = async function (message) {
            if (message.split(Encode.SEPARATOR)[0]===Encode.ADDED) {
                a++;
            }
            if (message.split(Encode.SEPARATOR)[0]===Encode.UPDATED) {
                messageCount++;
                byteCount+=message.length;
            }
        };

        let startMillis = new Date().getTime();
        let lastCount = 0;
        let lastByteCount = 0;

        for (let i = 0; i < numberOfClients; i++) {
            await clients[i].add(entityIds[i], 1, 2, 3, 4, 5, 6, 7, "<a-box></a-box>", Encode.AVATAR);
        }

        await waitOnCondition(() => {
            console.log(a);
            return a >= numberOfClients;
        });

        for (let j = 0; j < numberOfUpdateRounds; j++) {
            for (let i = 0; i < numberOfClients; i++) {
                await clients[i].update(entityIds[i], 1, 2, 3, 4, 5, 6, 7);
            }
        }

        await waitOnCondition(() => {
            const endMillis = new Date().getTime();
            const timeMillis = endMillis - startMillis;
            startMillis = endMillis;
            //console.log("time spent: " + timeMillis + " ms.")
            console.log(messageCount + ") " + ((byteCount - lastByteCount) / (timeMillis / 1000) / 1024).toFixed(0) + " kbytes/s " + ((messageCount - lastCount) / (timeMillis / 1000) / 1000).toFixed(2) + " kmsg/s.")
            lastCount = messageCount;
            lastByteCount = byteCount;

            return messageCount >= numberOfClients * numberOfClients * numberOfUpdateRounds;
        });


        for (let i = 0; i < numberOfClients; i++) {
            clients[i].close();
        }

    }).timeout(20000);

});