import 'mocha';

import {Server} from "../../../src/common/dataspace/Server";
import {Grid} from "../../../src/common/dataspace/Grid";
import {Processor} from "../../../src/common/dataspace/Processor";
import {Client} from "../../../src/common/dataspace/Client";
import uuid = require("uuid");
import {expect} from "chai";
import {Encode} from "../../../src/common/dataspace/Encode";
import {equals} from "typescript-collections/dist/lib/arrays";
import {waitOnCondition} from "./util";

describe('Integration Test Client', () => {

    it('Should connect client to localhost.', async () => {
        const client = new Client("ws://127.0.0.1:8889/");
        await client.connect();
        client.close();
    });

    it('Should connect client to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const client = new Client("wws://aframe-dataspace-0-0-0.herokuapp.com/");
        await client.connect();
        client.close();
    });

    it('Should connect multiple clients to aframe-dataspace-0-0-0.herokuapp.com.', async () => {
        const n = 20;
        const clients: Array<Client> = [];
        const entityIds: Array<string> = [];

        for (let i = 0; i < n; i++) {
            clients.push(new Client("wws://aframe-dataspace-0-0-0.herokuapp.com/"));
            entityIds.push(uuid.v4());
            await clients[i].connect();
        }

        let a = 0;
        let c = 0;

        for (let i = 0; i < n; i++) {
            clients[i].onReceive = async function (message) {
                if (message.split(Encode.SEPARATOR)[0]===Encode.UPDATED) {
                    c++;
                }
            };
        }

        clients[n-1].onReceive = async function (message) {
            if (message.split(Encode.SEPARATOR)[0]===Encode.ADDED) {
                a++;
            }
            if (message.split(Encode.SEPARATOR)[0]===Encode.UPDATED) {
                c++;
            }
        };

        const startMillis = new Date().getTime();

        for (let i = 0; i < n; i++) {
            await clients[i].add(entityIds[i], 1, 2, 3, 4, 5, 6, 7, "d");
        }

        await waitOnCondition(() => {
            console.log(a);
            return a >= n;
        });

        const repeats = 2;
        for (let j = 0; j < 2; j++) {
            for (let i = 0; i < n; i++) {
                await clients[i].update(entityIds[i], 1, 2, 3, 4, 5, 6, 7);
            }
        }

        await waitOnCondition(() => {
            console.log(c);
            return c >= n * n * repeats;
        });

        const endMillis = new Date().getTime();
        const timeMillis = endMillis - startMillis;

        console.log("time spent: " + timeMillis + " ms.")
        console.log("receive throughput: " + (c / (timeMillis / 1000)) + " messages/s.")

        for (let i = 0; i < n; i++) {
            clients[i].close();
        }

    }).timeout(10000);

});