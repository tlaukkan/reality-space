import {Encode} from "./Encode";

interface OnReceive { (message: string): void }
interface WebSocketConstruct { (url: string, protocol:string): WebSocket }
interface OnClose { (): void }

export class Client {

    url: string;
    ws: WebSocket = undefined as any as WebSocket;
    connected: boolean = false;

    constructor(url: string) {
        this.url = url;
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
                this.ws.onopen = () => {
                    this.connected = true;
                    resolve();
                };
                this.ws.onmessage = (message) => {
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

    onReceive: OnReceive = (message:string) => {};

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

    async act(id: string, action: string) {
        await this.send(Encode.act(id, action));
    }

}