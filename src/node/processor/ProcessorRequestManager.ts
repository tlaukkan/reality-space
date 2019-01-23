import {Processor} from "./Processor";
import {
    ClusterConfiguration, getRegionConfigurations,
    IdTokenIssuer,
    RegionConfiguration
} from "../../common/reality/Configuration";
import * as websocket from "websocket";
import {Connection} from "./Connection";
import {Decode, Encode} from "../..";
import {connection} from "websocket";
import {decodeIdToken, validateIdToken} from "../../common/reality/util/jwt";
import {Principal} from "../http/Principal";
import {info} from "../util/log";
import uuid = require("uuid");
import {Sanitizer} from "../../common/reality/Sanitizer";
import {Grid} from "./Grid";
import {StorageClient} from "../../common/reality/api/StorageClient";

export class ProcessorRequestManager {

    configuration: ClusterConfiguration;
    sanitizer: Sanitizer;

    spaceNameRegexs: Array<RegExp> = new Array<RegExp>();

    processorConfigurations: Map<string, RegionConfiguration>;
    processors: Map<string, Map<string, Processor>> = new Map();
    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(processorUrl: string, configuration: ClusterConfiguration, sanitizer: Sanitizer) {
        this.configuration = configuration;
        this.sanitizer = sanitizer;
        this.processorConfigurations = getRegionConfigurations(configuration, processorUrl);

        configuration.spaces.forEach((spaceName: string) => {
            this.spaceNameRegexs.push(RegExp('^' + spaceName.replace("*", ".*") + '$'));
        });

        configuration.idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })

    }

    async startup() {
        for (const spaceName of this.configuration.spaces) {
            if (spaceName.indexOf("*") == -1) { // Do not create wildcard spaces.
                for (const region of this.processorConfigurations.keys()) {
                    await this.getProcessor(spaceName, region);
                }
            }
        }
        console.log('reality server - started processor manager.')
    }

    async close() {
        for (const spaceProcessors of this.processors.values()) {
            for (const processor of spaceProcessors.values()) {
                processor.stop();
            }
        }
        console.log('reality server - closed processor manager.')
    }

    async getProcessor(spaceName: string, region: string): Promise<Processor | undefined> {

        if (spaceName.match(/[^0-9a-z\\-]/i)) {
            throw new Error("Only small alphanumerics and '-' allowed in space names.");
        }

        if (!this.processors.has(spaceName)) {
            for (let regExp of this.spaceNameRegexs) {
                if (regExp.test(spaceName)) {
                    this.processors.set(spaceName, new Map());
                }
            }
        }

        if (this.processors.has(spaceName) && !this.processors.get(spaceName)!!.has(region)) {
            if (this.processorConfigurations.has(region)) {
                const processor = this.newProcessor(this.processorConfigurations.get(region)!!, spaceName, region, this.sanitizer);
                await processor.start();
                this.processors.get(spaceName)!!.set(region, processor);
                console.log("reality server - region started: " + spaceName + "/" + region);
            }
        }

        if (this.processors.has(spaceName) && this.processors.get(spaceName)!!.has(region)) {
            return this.processors.get(spaceName)!!.get(region)!!;
        } else {
            console.warn("reality server - no such region: " + spaceName + "/" + region);
            return undefined;
        }

    }

    newProcessor(processorConfig: RegionConfiguration, spaceName: string, region: string, sanitizer: Sanitizer): Processor {
        return new Processor(
            processorConfig,
            spaceName,
            region,
            new Grid(
                processorConfig.x,
                processorConfig.y,
                processorConfig.z,
                processorConfig.edge,
                processorConfig.step,
                processorConfig.range
            ), sanitizer
        );
    }

    public async processConnection(request: websocket.request) {
        console.log('reality server - client connected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
        const ws = request.accept('ds-v1.0', request.origin);

        const connection = new Connection(uuid.v4());

        connection.send = async (message) => {
            ws.send(message);
        };
        ws.on('message', async (message: websocket.IMessage) => {
            if (message.utf8Data!!) {
                if (message.utf8Data!!.startsWith(Encode.LOGIN + '|')) {
                    await this.processLoginRequest(connection, ws, message.utf8Data!!, request.socket.remoteAddress!!, request.socket.remotePort!!);
                } else {
                    await connection.receive(message.utf8Data!!);
                }
            } else {
                console.warn('reality server - client message from ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ' without utf8Data.');
            }
        });
        ws.on('close', () => {
            console.log('reality server - client disconnected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
            if (connection.processor) {
                connection.processor.remove(connection);
            }
        });
    }

    private async processLoginRequest(connection: Connection, ws: connection, message: string, remoteAddress: string, remotePort: number) {
        try {
            const parts = message.split(Encode.SEPARATOR);
            const m = Decode.login(parts);
            const loginRequestId = m[0];
            const idToken = m[1];
            const spaceName = m[2];
            const region = m[3];

            if (!loginRequestId) {
                await this.processLoginError(ws, "", "no login request id in login request");
                return;
            }
            if (!idToken) {
                await this.processLoginError(ws, loginRequestId, "no id token in login request");
                return;
            }
            if (!spaceName) {
                await this.processLoginError(ws, loginRequestId, "no space name in login request");
                return;
            }
            if (!region) {
                await this.processLoginError(ws, loginRequestId, "no region name in login request");
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

            const processor = await this.getProcessor(spaceName, region);
            if (!processor) {
                await this.processLoginError(ws, loginRequestId, "no such processor: " + spaceName + "/" + region);
                return;
            }

            processor!!.add(connection);
            connection.processor = processor;

            const processorConfig = processor.processorConfig;
            const storageClient = new StorageClient(processor.spaceName, processor.region, processorConfig.storageUrl, processorConfig.cdnUrl, idToken);

            // check access rights
            try {
                await storageClient.getEntity("login-access-test")
            } catch (error) {
                await this.processLoginError(ws, loginRequestId, "access denied: " + error.message);
                return;
            }

            info(principal, "client login success to " + spaceName + "/" + region + " from: " + remoteAddress + ":" + remotePort);
            await ws.send(Encode.loginResponse(loginRequestId, ""));


        } catch (error) {
            console.error("error parsing login request", error);
            await this.processLoginError(ws, "", "error parsing login request");
        }
    }

    private async processLoginError(ws: websocket.connection, loginRequestId: string, errorMessage: string) {
        await ws.send(Encode.loginResponse(loginRequestId, errorMessage));
        console.warn("reality server - login request failed " + loginRequestId + " : " + errorMessage);
        ws.close();
    }
}