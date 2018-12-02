import * as websocket from "websocket";
import * as http from "http";
import {Processor} from "../../common/dataspace/Processor";
import {Connection} from "../../common/dataspace/Connection";
import uuid = require("uuid");
import {StorageRestService} from "../api/StorageRestService";
import {IncomingMessage} from "http";
import {Principal} from "../../common/dataspace/Principal";
import {decodeIdToken, validateIdToken} from "../../common/util/jwt";
import {IdTokenIssuer} from "../../common/dataspace/Configuration";
import {Context} from "./Context";
import {errorWithRequestId, info, warnWithRequestId} from "../util/log";

export class Server {

    host: string;
    port: number;
    processor: Processor;
    storageRestService: StorageRestService;
    webSocketServer: websocket.server = undefined as any as websocket.server;

    httpServer: http.Server = undefined as any as http.Server;
    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(host: string, port: number, processor: Processor, storageRestService: StorageRestService, idTokenIssuers: Array<IdTokenIssuer>) {
        this.host = host;
        this.port = port;
        this.processor = processor;
        this.storageRestService = storageRestService;
        idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })

    }

    listen() {
        this.httpServer = http.createServer(async (request, response) => {
            try {
                if (request.url === '/health') {
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    response.end();
                    return;
                }

                let principal = this.authorizeRequest(request);
                if (!principal) {
                    response.writeHead(401, {'Content-Type': 'text/plain'});
                    response.end();
                    return true;
                }
                let context = new Context(principal, request, response, false);

                if ((await this.storageRestService.process(context)).processed) {
                    return;
                }

                info(context.context, "404 " + request.method + ": " + request.url + " not found");
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end();
                return true;
            } catch (error) {
                console.log("500 " + request.method + ": " + request.url + " error processing request.");
                console.warn(error);
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end();
                return true;
            }
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

    authorizeRequest(request: IncomingMessage): Principal | undefined {
        const requestId = request.headers['request-id'] as string;
        if (!requestId) {
            warnWithRequestId("", "Request-ID header does not exist.");
            return undefined;
        }

        try {

            if (!request.headers.authorization) {
                warnWithRequestId(requestId, "Authorization header does not exist.");
                return undefined;
            } else if (!request.headers.authorization.startsWith("Bearer ")) {
                warnWithRequestId(requestId, "Authorization header does not contain Bearer token.");
                return undefined;
            }
            const idToken = request.headers.authorization.substring("Bearer ".length);
            const issuer = decodeIdToken(idToken).get("iss") as string;
            if (!issuer) {
                warnWithRequestId(requestId, "Issuer claim not found.");
                return undefined;
            }
            const idTokenIssuer = this.issuers.get(issuer!! as string)!!;
            if (!idTokenIssuer) {
                warnWithRequestId(requestId, "Issuer not found: " + issuer);
                return undefined;
            }
            const claims = validateIdToken(idToken, idTokenIssuer.publicKey);
            if (!claims.has("id") || !claims.has("exp") || !claims.has("name") || !claims.get("jti")) {
                warnWithRequestId(requestId, "Missing mandatory claims.");
                return undefined;
            }
            return new Principal(issuer, claims.get("jti") as string, requestId, claims.get("id")!! as string, claims.get("name")!!  as string);
        } catch (error) {
            warnWithRequestId(requestId, "Error decoding authorization token.");
            return undefined;
        }
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