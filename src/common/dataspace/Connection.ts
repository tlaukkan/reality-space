import Queue from "typescript-collections/dist/lib/Queue";

interface MessageSend { (message: string): Promise<void> }

export class Connection {

    id: string;

    entityIds: Set<string> = new Set();

    constructor(id: string) {
        this.id = id;
    }

    send: MessageSend = async (message:string) => {};

    receive: MessageSend = async (message:string) => {};

    outQueue: Queue<[string,string]> = new Queue<[string,string]>();
}