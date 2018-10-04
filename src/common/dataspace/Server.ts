import * as websocket from "websocket";
import * as http from "http";
import {Processor} from "./Processor";
import {Connection} from "./Connection";
import uuid = require("uuid");

export class Server {

    host: string;
    port: number;
    processor: Processor;
    webSocketServer: websocket.server = undefined as any as websocket.server;

    httpServer: http.Server = undefined as any as http.Server;

    constructor(host: string, port: number, processor: Processor) {
        this.host = host;
        this.port = port;
        this.processor = processor;
    }

    listen() {
        this.httpServer = http.createServer(function (request, response) {
            if (request.url!!.endsWith('/health-check')) {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end();
            }
        });

        this.webSocketServer = new websocket.server({httpServer: this.httpServer});
        this.webSocketServer.on('request', (request) => this.processConnection(request));

        this.processor.start();
        this.httpServer.listen(this.port, this.host);

        console.log('dataspace server - started at ws://' + this.host + ':' + this.port + '/');
    }

    close() {
        console.log('dataspace server - closing ...');
        this.processor.stop();
        this.httpServer.close();
        this.webSocketServer.shutDown();
        console.log('dataspace server - closed.\n');
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
            console.log('dataspace server - client message from ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ':' + message.utf8Data!!);
            await connection.receive(message.utf8Data!!);
        });
        ws.on('close', () => {
            console.log('dataspace server - client disconnected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
            this.processor.remove(connection);
        });
    }

}