import Queue from "typescript-collections/dist/lib/Queue";
import {Processor} from "./Processor";
import {Principal} from "../http/Principal";
interface MessageSend { (message: string): Promise<void> }

interface MessageReceive { (message: string): void }

export class Connection {

    id: string;

    principal: Principal | undefined;

    entityIds: Set<string> = new Set();

    processor: Processor | undefined;

    constructor(id: string) {
        this.id = id;
    }

    send: MessageSend = async (message:string) => {};

    receive: MessageReceive = (message:string) => {};

    outQueue: Queue<[string,string]> = new Queue<[string,string]>();
}