import {ClusterConfiguration, getClusterConfiguration, ServerInfo} from "./Configuration";
import {Client} from "./Client";
import {Encode} from "./Encode";

interface OnReceive { (type: string, message: string[]): void }
interface OnClose { (): void }

export class ClusterClient {

    clusterConfigurationUrl: string;
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

    constructor(clusterConfigurationUrl: string, avatarId: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, avatarDescription: string) {
        this.clusterConfigurationUrl = clusterConfigurationUrl;
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
           client.close();
        });
        this.clients.clear();
    }

    async refresh(x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) {
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
            if (this.primaryServerUrl!==newServers[0].url) {
                if (this.primaryServerUrl && this.clients.has(this.primaryServerUrl)) {
                    console.log("cluster client - switching primary server...");
                    this.closeClient(this.clients.get(this.primaryServerUrl)!!)
                    console.log("cluster client - disconnected old primary server: " + this.primaryServerUrl);
                }
                if (this.clients.has(newServers[0].url)) {
                    this.closeClient(this.clients.get(newServers[0].url)!!)
                    console.log("cluster client - disconnected secondary server as it is promoted to primary server: " + newServers[0].url);
                }
                this.primaryServerUrl = newServers[0].url;
                console.log("cluster client - new primary server set to: " + newServers[0].url);
            }
        }

        for (let server of newServers) {
            if (!this.clients.has(server.url)) {
                let client = new Client(server.url);
                client.onClose = () => {
                    if (this.primaryServerUrl === client.url) {
                        this.onClose();
                    }
                    this.clients.delete(server.url);
                };
                client.onReceive = (message: string) => {
                    const parts = message.split(Encode.SEPARATOR);
                    this.onReceive(parts[0], parts);
                };
                await client.connect();
                // Add clients for servers which are in range and not connected yet.
                if (client.url === this.primaryServerUrl) {
                    // Add avatar
                    console.log("cluster client - connected to primary server: " + client.url);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, this.avatarDescription);
                } else {
                    // Add probe
                    console.log("cluster client - connected to secondary server: " + client.url);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, "");
                }
                this.clients.set(server.url, client);
            } else {
                // Update avatars and probes for servers in range..
                await this.clients.get(server.url)!!.update(this.avatarId, x, y, z, rx, ry, rz, rw);
            }
        }

        // Close clients for servers which are not in range.
        this.clients.forEach((client) => {
            for (let server of newServers) {
                if (server.url === client.url) {
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
    }

    getClient() : Client | undefined {
        if (!this.primaryServerUrl) {
            return undefined;
        }
        return this.clients.get(this.primaryServerUrl);
    }

    isConnected() : boolean {
        return !!this.primaryServerUrl;
    }

    onClose: OnClose = () => {};

    onReceive: OnReceive = (type: string, message: string[]) => {};

    async add(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string) {
        if (this.isConnected()) {
            await this.getClient()!!.add(id, x, y, z, rx, ry, rz, rw, description);
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

    async act(id: string, action: string) {
        if (this.isConnected()) {
            await this.getClient()!!.act(id, action);
        }
    }

    /**
     * Gets servers with closest server as first.
     * @param x the connection avatar x coordinate
     * @param y the connection avatar y coordinate
     * @param z the connection avatar z coordinate
     * @return array of ServerInfo with closest server as first.
     */
    getServers(x: number, y: number, z: number): Array<ServerInfo> {
        const edge = this.clusterConfiguration!!.edge;
        const servers = Array<ServerInfo>();
        let lastD2 = edge * 2;
        for (let serverInfo of this.clusterConfiguration!!.servers) {

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