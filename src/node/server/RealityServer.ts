import * as websocket from "websocket";
import * as http from "http";
import {StorageRequestManager} from "../storage/StorageRequestManager";
import {IdTokenIssuer} from "../../common/reality/Configuration";
import {Context} from "../http/Context";
import {processRequest} from "../http/http";
import {ProcessorRequestManager} from "../processor/ProcessorRequestManager";

export class RealityServer {

    host: string;
    port: number;

    processorManager: ProcessorRequestManager | undefined;
    storageManager: StorageRequestManager | undefined;

    httpServer: http.Server = undefined as any as http.Server;
    webSocketServer: websocket.server = undefined as any as websocket.server;

    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(host: string, port: number, processorManager: ProcessorRequestManager | undefined, storageManager: StorageRequestManager | undefined, idTokenIssuers: Array<IdTokenIssuer>) {
        this.host = host;
        this.port = port;
        this.processorManager = processorManager;
        this.storageManager = storageManager;
        idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })
    }

    async startup() {
        this.httpServer = http.createServer(async (request, response) => {
            if (this.storageManager) {
                await processRequest(request, response, [
                    async (c: Context) => this.storageManager!!.process(c)
                ], this.issuers);
            } else {
                await processRequest(request, response, [], this.issuers);
            }
        });

        if (this.storageManager) {
            await this.storageManager.startup();
        }

        if (this.processorManager) {
            this.webSocketServer = new websocket.server({httpServer: this.httpServer});
            this.webSocketServer.on('request', async (request) => await this.processorManager!!.processConnection(request));
            await this.processorManager.startup();
        }

        this.httpServer.listen(this.port, this.host);
        console.log('reality server - started http server.')

        if (this.processorManager) {
            console.log('reality server - processor listening at local URL: ws://' + this.host + ':' + this.port + '/');
        }
        if (this.storageManager) {
            console.log('reality server - storage listening at local URL: http://' + this.host + ':' + this.port + '/api');
        }

    }

    async close() {
        if (this.processorManager) {
            await this.processorManager.close();
            this.webSocketServer.shutDown();
        }
        if (this.storageManager) {
            await this.storageManager.close();
        }
        this.httpServer.close();
        console.log('reality server - closed http server.');

        console.log('reality server - closed.');
    }

}