import {Processor} from "../processor/Processor";
import {IdTokenIssuer} from "../../common/dataspace/Configuration";
import * as websocket from "websocket";
import {Connection} from "../processor/Connection";
import {Decode, Encode} from "../..";
import {connection} from "websocket";
import {decodeIdToken, validateIdToken} from "../../common/util/jwt";
import {Principal} from "../framework/rest/Principal";
import {info} from "../util/log";
import uuid = require("uuid");

export class ProcessorManager {

    processor: Processor | undefined;
    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(processor: Processor | undefined, idTokenIssuers: Array<IdTokenIssuer>) {
        this.processor = processor;
        idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })
    }

    async startup() {
        if (this.processor) {
            console.log('reality server - started processor.');
            this.processor.start();
        }
    }

    async close() {
        if (this.processor) {
            this.processor.stop();
        }
    }

    public async processConnection(request: websocket.request) {
        console.log('reality server - client connected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
        const ws = request.accept('ds-v1.0', request.origin);

        const connection = new Connection(uuid.v4());
        this.processor!!.add(connection);
        connection.send = async (message) => {
            ws.send(message);
        };
        ws.on('message', async (message: websocket.IMessage) => {
            if (message.utf8Data!!) {
                if (message.utf8Data!!.startsWith(Encode.LOGIN + '|')) {
                    await this.processLoginRequest(ws, message.utf8Data!!, request.socket.remoteAddress!!, request.socket.remotePort!!);
                } else {
                    await connection.receive(message.utf8Data!!);
                }
            } else {
                console.warn('reality server - client message from ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ' without utf8Data.');
            }
        });
        ws.on('close', () => {
            console.log('reality server - client disconnected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
            this.processor!!.remove(connection);
        });
    }

    private async processLoginRequest(ws: connection, message: string, remoteAddress: string, remotePort: number) {
        try {
            const parts = message.split(Encode.SEPARATOR);
            const m = Decode.login(parts);
            const loginRequestId = m[0];
            const idToken = m[1];
            const dimensionName = m[2];
            const processorName = m[3];

            if (!loginRequestId) {
                await this.processLoginError(ws, "", "no login request id in login request");
                return;
            }
            if (!idToken) {
                await this.processLoginError(ws, loginRequestId, "no id token in login request");
                return;
            }
            if (!dimensionName) {
                await this.processLoginError(ws, loginRequestId, "no dimension name in login request");
                return;
            }
            if (!dimensionName) {
                await this.processLoginError(ws, loginRequestId, "no processor name name in login request");
                return;
            }

            const issuer = decodeIdToken(idToken).get("iss") as string;
            if (!issuer) {
                await this.processLoginError(ws, loginRequestId, "id token issuer claim not found in jwt");
                return;
            }

            const idTokenIssuer = this.issuers.get(issuer!! as string)!!;
            if (!idTokenIssuer) {
                await this.processLoginError(ws, loginRequestId, "id token issuer not found: " + issuer);
                return;
            }

            const claims = validateIdToken(idToken, idTokenIssuer.publicKey);
            if (!claims.has("id") || !claims.has("exp") || !claims.has("name") || !claims.get("jti")) {
                await this.processLoginError(ws, loginRequestId, "id token missing mandatory claims");
                return;
            }

            const groupsString = claims.get("groups");
            const groups = groupsString ? groupsString.split(",") : undefined;
            const principal = new Principal(issuer, claims.get("jti") as string, loginRequestId, claims.get("id")!! as string, claims.get("name")!! as string, groups);

            info(principal, "client login success to " + dimensionName + "/" + processorName + " from: " + remoteAddress + ":" + remotePort);
            await ws.send(Encode.loginResponse(loginRequestId, ""));

        } catch (error) {
            await this.processLoginError(ws, "", "error parsing login request");
        }
    }

    private async processLoginError(ws: websocket.connection, loginRequestId: string, errorMessage: string) {
        await ws.send(Encode.loginResponse(loginRequestId, errorMessage));
        console.warn("reality server - login request failed " + loginRequestId + " : " + errorMessage);
        ws.close();
    }
}