import * as websocket from "websocket";
import * as http from "http";
import {StorageApi} from "../api/StorageApi";
import {IdTokenIssuer} from "../../common/dataspace/Configuration";
import {Context} from "../framework/http/Context";
import {processRequest} from "../framework/http/http";
import {ProcessorManager} from "./ProcessorManager";

export class RealityServer {

    host: string;
    port: number;
    processorManager: ProcessorManager | undefined;
    storageApi: StorageApi | undefined;
    webSocketServer: websocket.server = undefined as any as websocket.server;

    httpServer: http.Server = undefined as any as http.Server;
    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(host: string, port: number, processorManager: ProcessorManager | undefined, storageApi: StorageApi | undefined, idTokenIssuers: Array<IdTokenIssuer>) {
        this.host = host;
        this.port = port;
        this.processorManager = processorManager;
        this.storageApi = storageApi;
        idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })
    }

    async startup() {
        this.httpServer = http.createServer(async (request, response) => {
            if (this.storageApi) {
                await processRequest(request, response, [
                    async (c: Context) => this.storageApi!!.process(c)
                ], this.issuers);
            } else {
                await processRequest(request, response, [], this.issuers);
            }
        });

        if (this.storageApi) {
            await this.storageApi.startup();
            console.log('reality server - started storages.')
        }

        if (this.processorManager) {
            this.webSocketServer = new websocket.server({httpServer: this.httpServer});
            this.webSocketServer.on('request', async (request) => await this.processorManager!!.processConnection(request));
            await this.processorManager.startup();
            console.log('reality server - started processors.')
        }

        this.httpServer.listen(this.port, this.host);

        if (this.processorManager) {
            console.log('reality server - processor listening at local URL: at ws://' + this.host + ':' + this.port + '/');
        }
        if (this.storageApi) {
            console.log('reality server - storage listening at local URL: http://' + this.host + ':' + this.port + '/api');
        }

    }

    async close() {
        if (this.processorManager) {
            await this.processorManager.close();
            this.webSocketServer.shutDown();
            console.log('reality server - closed processors.')
        }
        if (this.storageApi) {
            await this.storageApi.shutdown();
            console.log('reality server - closed storages.')
        }
        this.httpServer.close();
        console.log('reality server - http server.')
        console.log('reality server - closed.');
    }

}