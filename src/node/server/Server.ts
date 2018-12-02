import * as websocket from "websocket";
import * as http from "http";
import {Processor} from "../../common/dataspace/Processor";
import {Connection} from "../../common/dataspace/Connection";
import uuid = require("uuid");
import {StorageApi} from "../api/StorageApi";
import {IdTokenIssuer} from "../../common/dataspace/Configuration";
import {Context} from "../framework/http/Context";
import {processRequest} from "../framework/http/http";

export class Server {

    host: string;
    port: number;
    processor: Processor;
    storageApi: StorageApi;
    webSocketServer: websocket.server = undefined as any as websocket.server;

    httpServer: http.Server = undefined as any as http.Server;
    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(host: string, port: number, processor: Processor, storageRestService: StorageApi, idTokenIssuers: Array<IdTokenIssuer>) {
        this.host = host;
        this.port = port;
        this.processor = processor;
        this.storageApi = storageRestService;
        idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })

    }

    listen() {
        this.httpServer = http.createServer(async (request, response) => {
            await processRequest(request, response, [
                async (c: Context) => this.storageApi.process(c)
            ], this.issuers);
        });

        this.webSocketServer = new websocket.server({httpServer: this.httpServer});
        this.webSocketServer.on('request', (request) => this.processConnection(request));

        this.processor.start();
        this.httpServer.listen(this.port, this.host);

        console.log('dataspace server - started at ws://' + this.host + ':' + this.port + '/');
    }

    close() {
        this.processor.stop();
        this.httpServer.close();
        this.webSocketServer.shutDown();
        console.log('dataspace server - closed.');
    }

    processConnection(request: websocket.request) {
        console.log('dataspace server - client connected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
        const ws = request.accept('ds-v1.0', request.origin);

        const connection = new Connection(uuid.v4());
        this.processor.add(connection);
        connection.send = async (message) => {
            ws.send(message);
        };
        ws.on('message', async (message: websocket.IMessage) => {
            //console.log('dataspace server - client message from ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ':' + message.utf8Data!!);
            await connection.receive(message.utf8Data!!);
        });
        ws.on('close', () => {
            console.log('dataspace server - client disconnected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
            this.processor.remove(connection);
        });
    }

}