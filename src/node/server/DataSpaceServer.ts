import * as websocket from "websocket";
import * as http from "http";
import {Processor} from "../processor/Processor";
import {Connection} from "../processor/Connection";
import uuid = require("uuid");
import {StorageApi} from "../api/StorageApi";
import {IdTokenIssuer} from "../../common/dataspace/Configuration";
import {Context} from "../framework/http/Context";
import {endResponseWithError, processRequest} from "../framework/http/http";

export class DataSpaceServer {

    host: string;
    port: number;
    processor: Processor | undefined;
    storageApi: StorageApi | undefined;
    webSocketServer: websocket.server = undefined as any as websocket.server;

    httpServer: http.Server = undefined as any as http.Server;
    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(host: string, port: number, processor: Processor | undefined, storageApi: StorageApi | undefined, idTokenIssuers: Array<IdTokenIssuer>) {
        this.host = host;
        this.port = port;
        this.processor = processor;
        this.storageApi = storageApi;
        idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })
    }

    startup() {
        this.httpServer = http.createServer(async (request, response) => {
            if (this.storageApi) {
                await processRequest(request, response, [
                    async (c: Context) => this.storageApi!!.process(c)
                ], this.issuers);
            }
        });

        if (this.processor) {
            console.log('dataspace server - started processor.')
            this.webSocketServer = new websocket.server({httpServer: this.httpServer});
            this.webSocketServer.on('request', (request) => this.processConnection(request));
            this.processor.start();
        }

        this.httpServer.listen(this.port, this.host);

        if (this.processor) {
            console.log('dataspace server - processor listening at local URL: at ws://' + this.host + ':' + this.port + '/');
        }
        if (this.storageApi) {
            console.log('dataspace server - storage listening at local URL: http://' + this.host + ':' + this.port + '/api');
        }

    }

    async close() {
        if (this.processor) {
            this.processor.stop();
            this.webSocketServer.shutDown();
        }
        if (this.storageApi) {
            await this.storageApi.shutdown();
        }
        this.httpServer.close();
        console.log('dataspace server - closed.');
    }

    processConnection(request: websocket.request) {
        console.log('dataspace server - client connected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
        const ws = request.accept('ds-v1.0', request.origin);

        const connection = new Connection(uuid.v4());
        this.processor!!.add(connection);
        connection.send = async (message) => {
            ws.send(message);
        };
        ws.on('message', async (message: websocket.IMessage) => {
            //console.log('dataspace server - client message from ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ':' + message.utf8Data!!);
            await connection.receive(message.utf8Data!!);
        });
        ws.on('close', () => {
            console.log('dataspace server - client disconnected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
            this.processor!!.remove(connection);
        });
    }

}