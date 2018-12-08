import {Encode} from "./Encode";
import {StorageClient} from "./api/StorageClient";
import {Decode} from "./Decode";
import {parseRootSids} from "../../node/util/parser";

interface OnReceive { (message: string): void }
interface OnStoredEntitiesLoaded { (entitiesXml: string): void }
interface OnStoredEntitiesChanged { (sids: Array<string>, entitiesXml: string): void }
interface WebSocketConstruct { (url: string, protocol:string): WebSocket }
interface OnClose { (): void }

export class Client {

    serverName: string;
    url: string;
    apiUrl: string;
    assetUrl: string;
    ws: WebSocket = undefined as any as WebSocket;
    storageClient: StorageClient;
    connected: boolean = false;
    idToken: string;

    constructor(serverName: string, url: string, apiUrl: string, assetUrl: string, idToken: string) {
        this.serverName = serverName;
        this.url = url;
        this.apiUrl = apiUrl;
        this.assetUrl = assetUrl;
        this.idToken = idToken;
        this.storageClient = new StorageClient(serverName, apiUrl, assetUrl, idToken);
    }

    newWebSocket: WebSocketConstruct = (url:string, protocol:string) => { return new WebSocket(url, protocol)};

    isConnected() {
        return this.connected;
    }

    connect() : Promise<void>  {
        if (this.connected) {
            throw new Error("Error already connected.");
        }
        this.connected = false;
        return new Promise((resolve, reject) => {
            try {
                this.ws = this.newWebSocket(this.url, 'ds-v1.0');
                this.ws.onerror = (error) => {
                    this.connected = false;
                    console.warn("Error in client ws connection", error);
                    reject(error);
                };
                this.ws.onclose = () => {
                    this.connected = false;
                    this.onClose();
                };
                this.ws.onopen = async () => {
                    this.connected = true;
                    await this.loadEntities();
                    resolve();
                };
                this.ws.onmessage = async (message) => {
                    // Process storage notifications internally.
                    if ((message.data as string).startsWith(Encode.NOTIFIED + "|" + Encode.NOTIFICATION_STORAGE_UPDATE + "|")) {
                        if (await this.handleActions(message.data)) {
                            return;
                        }
                    }
                    this.onReceive(message.data);
                };
            } catch (error) {
                console.warn("Error in client ws connect", error);
                reject(error);
            }
        });
    }

    close() {
        if (typeof this.ws !== "undefined") {
            this.ws.close();
        }
    }

    onClose: OnClose = () => {};

    onReceive: OnReceive = (message: string) => {
    };

    send(message:string) {
        this.ws.send(message);
    }

    async add(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string, type: string) {
        await this.send(Encode.add(id, x, y, z, rx, ry, rz, rw, description, type));
    }

    async update(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) {
        await this.send(Encode.update(id, x, y, z, rx, ry, rz, rw));
    }

    async remove(id: string) {
        await this.send(Encode.remove(id));
    }

    async describe(id: string, description: string) {
        await this.send(Encode.describe(id, description));
    }

    async act(id: string, action: string, description: string) {
        await this.send(Encode.act(id, action, description));
    }

    async notify(notification: string, description: string) {
        await this.send(Encode.notify(notification, description));
    }

    async saveEntities(entitiesXml: string) {
        const savedEntitiesXml = await this.storageClient.saveRootElements(entitiesXml);
        const sids = parseRootSids(savedEntitiesXml);
        this.notify(Encode.NOTIFICATION_STORAGE_UPDATE, sids.toString());
    }

    async removeEntities(entitiesXml: string) {
        const sids = parseRootSids(entitiesXml);
        for (let sid of sids) {
            await this.storageClient.removeElement(sid);
        }
        await this.notify(Encode.NOTIFICATION_STORAGE_UPDATE, sids.toString());
    }

    onStoredEntitiesLoaded: OnStoredEntitiesLoaded = (entitiesXml:string) => {};
    onStoredEntitiesChanged: OnStoredEntitiesChanged = (sid:Array<string>, entitiesXml:string) => {};

    private async handleActions(message: string): Promise<boolean> {
        const parts = message.split(Encode.SEPARATOR);
        const m = Decode.notified(parts);
        const notification = m[0];
        const description = m[1];

        const sids = description.split(',');
        if (notification == Encode.NOTIFICATION_STORAGE_UPDATE) {
            await this.handleStorageUpdate(sids);
            return true;
        }

        return false;
    }

    private async handleStorageUpdate(sids: Array<string>) {
        await this.loadChangedEntities(sids);
    }

    private async loadEntities() {
        const entitiesXml = await this.storageClient.getPublicRootElements();
        this.onStoredEntitiesLoaded(entitiesXml);
    }

    private async loadChangedEntities(sids: Array<string>) {
        const entitiesXml = await this.storageClient.getPublicRootElements();
        this.onStoredEntitiesChanged(sids, entitiesXml);
    }
}