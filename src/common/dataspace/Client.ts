import {Encode} from "./Encode";
import {StorageClient} from "./api/StorageClient";
import {Decode} from "./Decode";
import {parseFragment, parseRootSids} from "../../node/util/parser";
import {Element, js2xml, xml2js} from "xml-js";

interface OnReceive { (message: string): void }
interface OnStoredRootEntityReceived { (sid: string, entityXml: string): void }
interface OnStoredChildEntityReceived { (parentSid: string, sid: string, entityXml: string): void }
interface OnStoredEntityRemoved { (sids: string): void }
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
                    resolve();
                    await this.loadStoredEntities();
                };
                this.ws.onmessage = async (message) => {
                    // Process storage notifications internally.
                    if ((message.data as string).startsWith(Encode.NOTIFIED + "|" + Encode.NOTIFICATION_STORED_ROOT_ENTITIES_CHANGED + "|") ||
                        (message.data as string).startsWith(Encode.NOTIFIED + "|" + Encode.NOTIFICATION_STORED_CHILD_ENTITIES_CHANGED + "|") ||
                        (message.data as string).startsWith(Encode.NOTIFIED + "|" + Encode.NOTIFICATION_STORED_ENTITIES_REMOVED + "|")) {
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



    // Events.

    onClose: OnClose = () => {};
    onReceive: OnReceive = (message: string) => {};
    onStoredRootEntityReceived: OnStoredRootEntityReceived = (sid: string, entityXml:string) => {};
    onStoredChildEntityReceived: OnStoredChildEntityReceived = (parentSid: string, sid: string, entityXml:string) => {};
    onStoredEntityRemoved: OnStoredEntityRemoved = (sid: string) => {};


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

    async storeEntities(entitiesXml: string) {
        const savedEntitiesXml = await this.storageClient.saveRootEntities(entitiesXml);
        const sids = parseRootSids(savedEntitiesXml);
        await this.notify(Encode.NOTIFICATION_STORED_ROOT_ENTITIES_CHANGED, sids.toString());
    }

    async storeChildEntities(parentSid: string, entitiesXml: string) {
        const savedEntitiesXml = await this.storageClient.saveChildEntities(parentSid, entitiesXml);
        const sids = parseRootSids(savedEntitiesXml);
        await this.notify(Encode.NOTIFICATION_STORED_CHILD_ENTITIES_CHANGED, [parentSid].concat(sids).toString());
    }

    async removeStoredEntities(sids: Array<string>) {
        for (let sid of sids) {
            await this.storageClient.removeEntity(sid);
        }
        await this.notify(Encode.NOTIFICATION_STORED_ENTITIES_REMOVED, sids.toString());
    }

    private async handleActions(message: string): Promise<boolean> {
        const parts = message.split(Encode.SEPARATOR);
        const m = Decode.notified(parts);
        const notification = m[0];
        const description = m[1];

        const sids = description.split(',');

        if (notification == Encode.NOTIFICATION_STORED_ROOT_ENTITIES_CHANGED) {
            await this.handleStoredRootEntityChanged(sids);
            return true;
        }
        if (notification == Encode.NOTIFICATION_STORED_CHILD_ENTITIES_CHANGED) {
            await this.handleStoredChildEntityChanged(sids[0], sids.splice(1));
            return true;
        }
        if (notification == Encode.NOTIFICATION_STORED_ENTITIES_REMOVED) {
            await this.handleStoredEntityRemoved(sids);
            return true;
        }

        return false;
    }

    private async loadStoredEntities() {
        const entitiesXml = await this.storageClient.getRootEntitiesFromCdn();
        if (entitiesXml) {
            const entities = parseFragment(entitiesXml);
            for (let element of entities.elements) {
                const sid = (element.attributes as any).sid as string;
                this.onStoredRootEntityReceived(sid, js2xml({elements: [element]}));
            }
        }
    }

    private async handleStoredRootEntityChanged(sids: Array<string>) {
        for (let sid of sids) {
            const entityXml = await this.storageClient.getEntity(sid);
            if (entityXml) {
                const elements = xml2js(entityXml)!!.elements as Array<Element>;
                const sid = (elements[0].attributes as any).sid as string;
                this.onStoredRootEntityReceived(sid, entityXml);
            }
        }
    }

    private async handleStoredChildEntityChanged(parentSid: string, sids: Array<string>) {
        for (let sid of sids) {
            const entityXml = await this.storageClient.getEntity(sid);
            if (entityXml) {
                const elements = xml2js(entityXml)!!.elements as Array<Element>;
                const sid = (elements[0].attributes as any).sid as string;
                this.onStoredChildEntityReceived(parentSid, sid, entityXml);
            }
        }
    }

    private async handleStoredEntityRemoved(sids: Array<string>) {
        for (let sid of sids) {
            if (!await this.storageClient.getEntity(sid)) {
                this.onStoredEntityRemoved(sid)
            }
        }
    }

}