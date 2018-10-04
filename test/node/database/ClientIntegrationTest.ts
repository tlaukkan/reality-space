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
        const n = 3;
        const clients: Array<Client> = [];
        const entityIds: Array<string> = [];
        let c = 0;
        let a = 0;

        const startMillis = new Date().getTime();
        for (let i = 0; i < n; i++) {
            clients.push(new Client("wws://aframe-dataspace-0-0-0.herokuapp.com/"));
            entityIds.push(uuid.v4());
            await clients[i].connect();
            clients[i].onReceive = async function (message) {
                c++;
            };
        }

        clients[0].onReceive = async function (message) {
            c++;
            if (message.split(Encode.SEPARATOR)[0]===Encode.ADDED) {
                a++;
                console.log(a + ") " + message);
            }
        };

        for (let i = 0; i < n; i++) {
            await clients[i].add(entityIds[i], 1, 2, 3, 4, 5, 6, 7, "d");
        }


        console.log("about to create promise");

        /*const wait = (condition: (() => boolean)): Promise<void> =>  {
            return new Promise((resolve, reject) => {
                const timer = setInterval(() => {
                    if (condition()) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        };*/

        await waitOnCondition(() => { return a > 20});

        for (let i = 0; i < n; i++) {
            clients[i].close();
        }

        const endMillis = new Date().getTime();
        const timeMillis = endMillis - startMillis;

        console.log("time spent: " + timeMillis + " ms.")
        console.log("receive throughput: " + (c / (timeMillis / 1000)) + " messages/s.")
    });

});