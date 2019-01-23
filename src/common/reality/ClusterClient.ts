import {ClusterConfiguration, getClusterConfiguration, RegionConfiguration} from "./Configuration";
import {RealityClient} from "./RealityClient";
import {Encode} from "./Encode";

interface OnReceive { (processorUrl: string, type: string, message: string[]): void }
interface OnStoredRootEntityReceived { (processorUrl: string, sid: string, entityXml: string): void }
interface OnStoredChildEntityReceived { (processorUrl: string, parentSid: string, sid: string, entityXml: string): void }
interface OnStoredEntityRemoved { (processorUrl: string, sid: string): void }
interface OnConnect { (processorUrl: string): void }
interface OnDisconnect { (processorUrl: string): void }
interface WebSocketConstruct { (url: string, protocol:string): WebSocket }

export class ClusterClient {

    clusterConfigurationUrl: string;
    spaceName: string;
    idToken: string;
    avatarId: string;
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
    rw: number;
    avatarDescription: string;

    clusterConfiguration: ClusterConfiguration | undefined;

    primaryProcessorUrl: String | undefined = undefined;

    clients: Map<String, RealityClient> = new Map();

    constructor(clusterConfigurationUrl: string, spaceName: string, avatarId: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, avatarDescription: string, idToken: string) {
        this.clusterConfigurationUrl = clusterConfigurationUrl;
        this.spaceName = spaceName;
        this.idToken = idToken;
        this.avatarId = avatarId;
        this.x = x;
        this.y = y;
        this.z = z;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
        this.rw = rw;
        this.avatarDescription = avatarDescription;
    }

    newWebSocket: WebSocketConstruct = (url:string, protocol:string) => { return new WebSocket(url, protocol)};

    async connect(): Promise<void> {
        // Close outdated clients.
        this.clients.forEach(client => {
            client.close();
        });
        this.clients.clear();

        this.clusterConfiguration = await getClusterConfiguration(this.clusterConfigurationUrl);
        console.log("cluster client - connect: " + this.clusterConfigurationUrl);

        await this.refresh(this.x, this.y, this.z, this.rx, this.ry, this.rz, this.rw);
    }

    close() {
        console.log("cluster client - closing.");
        this.clients.forEach(client => {
           this.closeClient(client);
        });
        this.clients.clear();
    }

    async refresh(x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) {
        if (!this.clusterConfiguration) {
            return;
        }

        this.x = x;
        this.y = y;
        this.z = z;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
        this.rw = rw;

        const processors = this.getProcessors(x, y, z);

        if (processors.length === 0) {
            this.primaryProcessorUrl = undefined;
        } else {
            if (this.primaryProcessorUrl!==processors[0].processorUrl) {
                if (this.primaryProcessorUrl && this.clients.has(this.primaryProcessorUrl)) {
                    console.log("cluster client - switching primary processor...");
                    this.closeClient(this.clients.get(this.primaryProcessorUrl)!!)
                    console.log("cluster client - disconnected old primary processor: " + this.primaryProcessorUrl);
                }
                if (this.clients.has(processors[0].processorUrl)) {
                    this.closeClient(this.clients.get(processors[0].processorUrl)!!)
                    console.log("cluster client - disconnected secondary processor as it is promoted to primary processor: " + processors[0].processorUrl);
                }
                this.primaryProcessorUrl = processors[0].processorUrl;
                console.log("cluster client - new primary processor set to: " + processors[0].processorUrl);
            }
        }

        for (let processor of processors) {
            if (!this.clients.has(processor.processorUrl)) {
                let client = new RealityClient(this.spaceName, processor.region, processor.processorUrl, processor.storageUrl, processor.cdnUrl, this.idToken);
                this.clients.set(processor.processorUrl, client);
                client.newWebSocket = this.newWebSocket;
                client.onClose = () => {
                    console.log('cluster client - processor disconnected: ' + client.url);
                    if (this.primaryProcessorUrl === client.url) {
                        this.onDisconnect(client.url);
                    }
                    if (this.clients.get(processor.processorUrl) === client) {
                        this.clients.delete(processor.processorUrl);
                    }
                };
                client.onReceive = (message: string) => {
                    const parts = message.split(Encode.SEPARATOR);
                    this.onReceive(client.url, parts[0], parts);
                };
                client.onStoredRootEntityReceived = (sid, entityXml: string) => {
                    this.onStoredRootEntityReceived(client.url, sid, entityXml);
                };
                client.onStoredChildEntityReceived = (parentSid, sid, entityXml: string) => {
                    this.onStoredChildEntityReceived(client.url, parentSid, sid, entityXml);
                };
                client.onStoredEntityRemoved = (sid: string) => {
                    this.onStoredEntityRemoved(client.url, sid);
                };
                try {
                    await client.connect();
                    this.onConnect(client.url);
                } catch (error) {
                    console.log("cluster client - error connecting to processor.");
                    continue;
                }
                // Add clients for processors which are in range and not connected yet.
                if (client.url === this.primaryProcessorUrl) {
                    // Add avatar
                    console.log("cluster client - connected to primary processor: " + client.url);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, this.avatarDescription, Encode.AVATAR);
                } else {
                    // Add probe
                    console.log("cluster client - connected to secondary processor: " + client.url);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, "", Encode.PROBE);
                }
            } else {
                // Update avatars and probes for processors in range..
                if (this.clients.get(processor.processorUrl)!!.isConnected()) {
                    await this.clients.get(processor.processorUrl)!!.update(this.avatarId, x, y, z, rx, ry, rz, rw);
                }
            }
        }

        // Close clients for processors which are not in range.
        this.clients.forEach((client) => {
            for (let processor of processors) {
                if (processor.processorUrl === client.url) {
                    return;
                }
            }
            console.log("cluster client - closing client to processor not in range: " + client.url);
            this.closeClient(client);
        });

    }

    private closeClient(client: RealityClient) {
        this.clients.delete(client.url);
        client.close();
        this.onDisconnect(client.url);
    }

    getClient() : RealityClient | undefined {
        if (!this.primaryProcessorUrl) {
            return undefined;
        }
        return this.clients.get(this.primaryProcessorUrl);
    }

    isConnected() : boolean {
        return this.primaryProcessorUrl !== undefined && this.clients.has(this.primaryProcessorUrl) && this.clients.get(this.primaryProcessorUrl)!!.isConnected();
    }

    onConnect: OnConnect = (processorUrl: string) => {};

    onDisconnect: OnDisconnect = (processorUrl: string) => {};

    onReceive: OnReceive = (processorUrl: string, type: string, message: string[]) => {};

    onStoredRootEntityReceived: OnStoredRootEntityReceived = (processorUrl: string, sid: string, entityXml:string) => {};
    onStoredChildEntityReceived: OnStoredChildEntityReceived = (processorUrl: string, parentSid: string, sid: string, entityXml:string) => {};
    onStoredEntityRemoved: OnStoredEntityRemoved = (processorUrl: string, sid: string) => {};


    async add(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string) {
        if (this.isConnected()) {
            await this.getClient()!!.add(id, x, y, z, rx, ry, rz, rw, description, Encode.OBJECT);
        }
    }

    async update(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) {
        if (this.isConnected()) {
            await this.getClient()!!.update(id, x, y, z, rx, ry, rz, rw);
        }
    }

    async remove(id: string) {
        if (this.isConnected()) {
            await this.getClient()!!.remove(id);
        }
    }

    async describe(id: string, description: string) {
        if (this.isConnected()) {
            await this.getClient()!!.describe(id, description);
        }
    }

    async act(id: string, action: string, description: string) {
        if (this.isConnected()) {
            await this.getClient()!!.act(id, action, description);
        }
    }

    async storeEntities(processorUrl: string, entitiesXml: string) {
        if (this.clients.has(processorUrl)) {
            await this.clients.get(processorUrl)!!.storeEntities(entitiesXml);
        } else {
            throw new Error("Processor not connected: " + processorUrl);
        }
    }

    async storeChildEntities(processorUrl: string, parentSid: string, entitiesXml: string) {
        if (this.clients.has(processorUrl)) {
            await this.clients.get(processorUrl)!!.storeChildEntities(parentSid, entitiesXml);
        } else {
            throw new Error("Processor not connected: " + processorUrl);
        }
    }

    async removeStoredEntities(processorUrl: string, sids: Array<string>) {
        if (this.clients.has(processorUrl)) {
            await this.clients.get(processorUrl)!!.removeStoredEntities(sids);
        } else {
            throw new Error("Processor not connected: " + processorUrl);
        }
    }

    /**
     * Gets processors with closest processor as first.
     * @param x the connection avatar x coordinate
     * @param y the connection avatar y coordinate
     * @param z the connection avatar z coordinate
     * @return array of ProcessorConfigurations with closest processor as first.
     */
    getProcessors(x: number, y: number, z: number): Array<RegionConfiguration> {
        const processors = Array<RegionConfiguration>();
        let lastD2 = Number.MAX_SAFE_INTEGER;
        for (let processor of this.clusterConfiguration!!.regions) {

            if (x >= processor.x - processor.edge / 2 && x <= processor.x + processor.edge / 2 &&
                y >= processor.y - processor.edge / 2 && y <= processor.y + processor.edge / 2 &&
                z >= processor.z - processor.edge / 2 && z <= processor.z + processor.edge / 2) {
                const d2 = Math.pow(x - processor.x,2) + Math.pow(y - processor.y, 2) + Math.pow(z - processor.z, 2);
                if (d2 < lastD2) {
                    processors.unshift(processor);
                } else {
                    processors.push(processor);
                }
                lastD2 = d2;
            }
        }
        return processors;
    }


}