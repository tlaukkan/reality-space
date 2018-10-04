import {Encode} from "./Encode";
import {w3cwebsocket} from "websocket";

interface OnReceive { (message: string): void }
interface WebSocketConstruct { (url: string, protocol:string): w3cwebsocket }
interface OnClose { (): void }

export class Client {

    url: string;
    ws: w3cwebsocket = undefined as any as w3cwebsocket;

    constructor(url: string) {
        this.url = url;
    }

    constructWebSocket: WebSocketConstruct = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol)};

    connect() : Promise<w3cwebsocket>  {
        return new Promise((resolve, reject) => {
            try {
                this.ws = this.constructWebSocket(this.url, 'ds-v1.0');
                this.ws.onerror = (error) => {
                    console.warn("Error in client ws connection", error);
                    reject(error);
                };
                this.ws.onclose = () => {
                    this.onClose();
                };
                this.ws.onopen = () => {
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

    async add(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string) {
        await this.send(Encode.add(id, x, y, z, rx, ry, rz, rw, description));
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