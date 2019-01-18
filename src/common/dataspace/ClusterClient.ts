import {ClusterConfiguration, getClusterConfiguration, ProcessorConfig} from "./Configuration";
import {Client} from "./Client";
import {Encode} from "./Encode";

interface OnReceive { (serverUrl: string, type: string, message: string[]): void }
interface OnStoredRootEntityReceived { (serverUrl: string, sid: string, entityXml: string): void }
interface OnStoredChildEntityReceived { (serverUrl: string, parentSid: string, sid: string, entityXml: string): void }
interface OnStoredEntityRemoved { (serverUrl: string, sid: string): void }
interface OnConnect { (serverUrl: string): void }
interface OnDisconnect { (serverUrl: string): void }
interface WebSocketConstruct { (url: string, protocol:string): WebSocket }

export class ClusterClient {

    clusterConfigurationUrl: string;
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

    primaryServerUrl: String | undefined = undefined;

    clients: Map<String, Client> = new Map();

    constructor(clusterConfigurationUrl: string, avatarId: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, avatarDescription: string, idToken: string) {
        this.clusterConfigurationUrl = clusterConfigurationUrl;
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

        const newServers = this.getServers(x, y, z);

        if (newServers.length === 0) {
            this.primaryServerUrl = undefined;
        } else {
            if (this.primaryServerUrl!==newServers[0].processorUrl) {
                if (this.primaryServerUrl && this.clients.has(this.primaryServerUrl)) {
                    console.log("cluster client - switching primary server...");
                    this.closeClient(this.clients.get(this.primaryServerUrl)!!)
                    console.log("cluster client - disconnected old primary server: " + this.primaryServerUrl);
                }
                if (this.clients.has(newServers[0].processorUrl)) {
                    this.closeClient(this.clients.get(newServers[0].processorUrl)!!)
                    console.log("cluster client - disconnected secondary server as it is promoted to primary server: " + newServers[0].processorUrl);
                }
                this.primaryServerUrl = newServers[0].processorUrl;
                console.log("cluster client - new primary server set to: " + newServers[0].processorUrl);
            }
        }

        for (let server of newServers) {
            if (!this.clients.has(server.processorUrl)) {
                let client = new Client(server.name, server.processorUrl, server.storageUrl, server.cdnUrl, this.idToken);
                this.clients.set(server.processorUrl, client);
                client.newWebSocket = this.newWebSocket;
                client.onClose = () => {
                    console.log('cluster client - server disconnected: ' + client.url);
                    if (this.primaryServerUrl === client.url) {
                        this.onDisconnect(client.url);
                    }
                    if (this.clients.get(server.processorUrl) === client) {
                        this.clients.delete(server.processorUrl);
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
                    console.log("cluster client - error connecting to server.");
                    continue;
                }
                // Add clients for servers which are in range and not connected yet.
                if (client.url === this.primaryServerUrl) {
                    // Add avatar
                    console.log("cluster client - connected to primary server: " + client.url);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, this.avatarDescription, Encode.AVATAR);
                } else {
                    // Add probe
                    console.log("cluster client - connected to secondary server: " + client.url);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, "", Encode.PROBE);
                }
            } else {
                // Update avatars and probes for servers in range..
                if (this.clients.get(server.processorUrl)!!.isConnected()) {
                    await this.clients.get(server.processorUrl)!!.update(this.avatarId, x, y, z, rx, ry, rz, rw);
                }
            }
        }

        // Close clients for servers which are not in range.
        this.clients.forEach((client) => {
            for (let server of newServers) {
                if (server.processorUrl === client.url) {
                    return;
                }
            }
            console.log("cluster client - closing client to server not in range: " + client.url);
            this.closeClient(client);
        });

    }

    private closeClient(client: Client) {
        this.clients.delete(client.url);
        client.close();
        this.onDisconnect(client.url);
    }

    getClient() : Client | undefined {
        if (!this.primaryServerUrl) {
            return undefined;
        }
        return this.clients.get(this.primaryServerUrl);
    }

    isConnected() : boolean {
        return this.primaryServerUrl !== undefined && this.clients.has(this.primaryServerUrl) && this.clients.get(this.primaryServerUrl)!!.isConnected();
    }

    onConnect: OnConnect = (serverUrl: string) => {};

    onDisconnect: OnDisconnect = (serverUrl: string) => {};

    onReceive: OnReceive = (serverUrl: string, type: string, message: string[]) => {};

    onStoredRootEntityReceived: OnStoredRootEntityReceived = (serverUrl: string, sid: string, entityXml:string) => {};
    onStoredChildEntityReceived: OnStoredChildEntityReceived = (serverUrl: string, parentSid: string, sid: string, entityXml:string) => {};
    onStoredEntityRemoved: OnStoredEntityRemoved = (serverUrl: string, sid: string) => {};


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

    async storeEntities(serverUrl: string, entitiesXml: string) {
        if (this.clients.has(serverUrl)) {
            await this.clients.get(serverUrl)!!.storeEntities(entitiesXml);
        } else {
            throw new Error("Server not connected: " + serverUrl);
        }
    }

    async storeChildEntities(serverUrl: string, parentSid: string, entitiesXml: string) {
        if (this.clients.has(serverUrl)) {
            await this.clients.get(serverUrl)!!.storeChildEntities(parentSid, entitiesXml);
        } else {
            throw new Error("Server not connected: " + serverUrl);
        }
    }

    async removeStoredEntities(serverUrl: string, sids: Array<string>) {
        if (this.clients.has(serverUrl)) {
            await this.clients.get(serverUrl)!!.removeStoredEntities(sids);
        } else {
            throw new Error("Server not connected: " + serverUrl);
        }
    }

    /**
     * Gets servers with closest server as first.
     * @param x the connection avatar x coordinate
     * @param y the connection avatar y coordinate
     * @param z the connection avatar z coordinate
     * @return array of ServerInfo with closest server as first.
     */
    getServers(x: number, y: number, z: number): Array<ProcessorConfig> {
        const edge = this.clusterConfiguration!!.edge;
        const servers = Array<ProcessorConfig>();
        let lastD2 = edge * 2;
        for (let serverInfo of this.clusterConfiguration!!.processors) {

            if (x >= serverInfo.x - edge / 2 && x <= serverInfo.x + edge / 2 &&
                y >= serverInfo.y - edge / 2 && y <= serverInfo.y + edge / 2 &&
                z >= serverInfo.z - edge / 2 && z <= serverInfo.z + edge / 2) {
                const d2 = Math.pow(x - serverInfo.x,2) + Math.pow(y - serverInfo.y, 2) + Math.pow(z - serverInfo.z, 2);
                if (d2 < lastD2) {
                    servers.unshift(serverInfo);
                } else {
                    servers.push(serverInfo);
                }
                lastD2 = d2;
            }
        }
        return servers;
    }


}