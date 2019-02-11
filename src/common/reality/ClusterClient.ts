import {ClusterConfiguration, getClusterConfiguration, RegionConfiguration} from "./Configuration";
import {RealityClient} from "./RealityClient";
import {Encode} from "./Encode";
import {StorageClient} from "./StorageClient";

interface OnReceive { (region: string, type: string, message: string[]): void }
interface OnStoredRootEntityReceived { (region: string, sid: string, entityXml: string): void }
interface OnStoredChildEntityReceived { (region: string, parentSid: string, sid: string, entityXml: string): void }
interface OnStoredEntityRemoved { (region: string, sid: string): void }
interface OnConnect { (region: string): void }
interface OnDisconnect { (region: string): void }
interface WebSocketConstruct { (url: string, protocol:string): WebSocket }
interface OnLoaded { (region: string): void }
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

    primaryRegion: String | undefined = undefined;

    clients: Map<String, RealityClient> = new Map();

    defaultStorageClient: StorageClient | undefined = undefined;

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

        const defaultSpace = "default";
        const defaultRegion = this.getRegion(0, 0, 0)!!;
        const defaultRegionConfiguration = this.getRegionConfiguration(defaultRegion);

        this.defaultStorageClient = new StorageClient(defaultSpace, defaultRegion, defaultRegionConfiguration.storageUrl, defaultRegionConfiguration.cdnUrl, this.idToken);

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

        const regions = this.getRegions(x, y, z);

        if (regions.length === 0) {
            this.primaryRegion = undefined;
        } else {
            if (this.primaryRegion!==regions[0].region) {
                if (this.primaryRegion && this.clients.has(this.primaryRegion)) {
                    console.log("cluster client - switching primary region...");
                    this.closeClient(this.clients.get(this.primaryRegion)!!)
                    console.log("cluster client - disconnected old primary region: " + this.primaryRegion);
                }
                if (this.clients.has(regions[0].region)) {
                    this.closeClient(this.clients.get(regions[0].region)!!)
                    console.log("cluster client - disconnected secondary region as it is promoted to primary region: " + regions[0].region);
                }
                this.primaryRegion = regions[0].region;
                console.log("cluster client - new primary region set to: " + regions[0].region);
            }
        }

        for (let region of regions) {
            if (!this.clients.has(region.region)) {
                let client = new RealityClient(this.spaceName, region.region, region.processorUrl, region.storageUrl, region.cdnUrl, this.idToken);
                this.clients.set(region.region, client);
                client.newWebSocket = this.newWebSocket;
                client.onClose = () => {
                    console.log('cluster client - region disconnected: ' + client.region);
                    if (this.primaryRegion === client.region) {
                        this.onDisconnect(client.region);
                    }
                    if (this.clients.get(region.region) === client) {
                        this.clients.delete(region.region);
                    }
                };
                client.onReceive = (message: string) => {
                    const parts = message.split(Encode.SEPARATOR);
                    this.onReceive(client.region, parts[0], parts);
                };
                client.onStoredRootEntityReceived = (sid, entityXml: string) => {
                    this.onStoredRootEntityReceived(client.region, sid, entityXml);
                };
                client.onStoredChildEntityReceived = (parentSid, sid, entityXml: string) => {
                    this.onStoredChildEntityReceived(client.region, parentSid, sid, entityXml);
                };
                client.onStoredEntityRemoved = (sid: string) => {
                    this.onStoredEntityRemoved(client.region, sid);
                };
                client.onLoaded = () => {
                    this.onLoaded(client.region);
                };
                try {
                    await client.connect();
                    this.onConnect(client.region);
                } catch (error) {
                    console.log("cluster client - error connecting to region.");
                    continue;
                }
                // Add clients for regions which are in range and not connected yet.
                if (client.region === this.primaryRegion) {
                    // Add avatar
                    console.log("cluster client - connected to primary region: " + client.region);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, this.avatarDescription, Encode.AVATAR);
                } else {
                    // Add probe
                    console.log("cluster client - connected to secondary region: " + client.region);
                    await client.add(this.avatarId, x, y, z, rx, ry, rz, rw, "", Encode.PROBE);
                }
            } else {
                // Update avatars and probes for regions in range..
                if (this.clients.get(region.region)!!.isConnected()) {
                    await this.clients.get(region.region)!!.update(this.avatarId, x, y, z, rx, ry, rz, rw);
                }
            }
        }

        // Close clients for regions which are not in range.
        this.clients.forEach((client) => {
            for (let region of regions) {
                if (region.region === client.region) {
                    return;
                }
            }
            console.log("cluster client - closing client to region not in range: " + client.region);
            this.closeClient(client);
        });

    }

    private closeClient(client: RealityClient) {
        this.clients.delete(client.region);
        client.close();
        this.onDisconnect(client.region);
    }

    getClient() : RealityClient | undefined {
        if (!this.primaryRegion) {
            return undefined;
        }
        return this.clients.get(this.primaryRegion);
    }

    isConnected() : boolean {
        return this.primaryRegion !== undefined && this.clients.has(this.primaryRegion) && this.clients.get(this.primaryRegion)!!.isConnected();
    }

    onConnect: OnConnect = (region: string) => {};
    onDisconnect: OnDisconnect = (region: string) => {};
    onReceive: OnReceive = (region: string, type: string, message: string[]) => {};
    onStoredRootEntityReceived: OnStoredRootEntityReceived = (region: string, sid: string, entityXml:string) => {};
    onStoredChildEntityReceived: OnStoredChildEntityReceived = (region: string, parentSid: string, sid: string, entityXml:string) => {};
    onStoredEntityRemoved: OnStoredEntityRemoved = (region: string, sid: string) => {};
    onLoaded: OnLoaded = (region: string) => {};


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

    async storeEntities(region: string, entitiesXml: string) {
        if (this.clients.has(region)) {
            await this.clients.get(region)!!.storeEntities(entitiesXml);
        } else {
            throw new Error("Region not connected: " + region);
        }
    }

    async storeChildEntities(region: string, parentSid: string, entitiesXml: string) {
        if (this.clients.has(region)) {
            await this.clients.get(region)!!.storeChildEntities(parentSid, entitiesXml);
        } else {
            throw new Error("Region not connected: " + region);
        }
    }

    async removeStoredEntities(region: string, sids: Array<string>) {
        if (this.clients.has(region)) {
            await this.clients.get(region)!!.removeStoredEntities(sids);
        } else {
            throw new Error("Region not connected: " + region);
        }
    }

    public async storeEntity(entityXml: string, x: number, y: number, z: number) {
        if (!this.isConnected()) {
            console.warn("No region found at " + x + "," + y + "," + z);
            throw new Error("Not connected.");
        }

        const region = this.getRegion(x, y, z);
        if (region) {
            await this.storeEntities(region, "<a-entities>" + entityXml + "</a-entities>");
        } else {
            console.warn("No region found at " + x + "," + y + "," + z);
        }
    }

    public async removeStoredEntity(entitySid: string, x: number, y: number, z: number) {
        if (!this.isConnected()) {
            console.warn("No region found at " + x + "," + y + "," + z);
            throw new Error("Not connected.");
        }

        const region = this.getRegion(x, y, z);
        if (region) {
            await this.removeStoredEntities(region, [entitySid]);
        } else {
            console.warn("No region found at " + x + "," + y + "," + z);
        }
    }

    /**
     * Gets regions with closest region as first.
     * @param x the connection avatar x coordinate
     * @param y the connection avatar y coordinate
     * @param z the connection avatar z coordinate
     * @return array of RegionConfigurations with closest region as first.
     */
    getRegions(x: number, y: number, z: number): Array<RegionConfiguration> {
        if (this.clusterConfiguration) {
            const regions = Array<RegionConfiguration>();
            let lastD2 = Number.MAX_SAFE_INTEGER;
            for (let region of this.clusterConfiguration!!.regions) {

                if (x >= region.x - region.edge / 2 && x <= region.x + region.edge / 2 &&
                    y >= region.y - region.edge / 2 && y <= region.y + region.edge / 2 &&
                    z >= region.z - region.edge / 2 && z <= region.z + region.edge / 2) {
                    const d2 = Math.pow(x - region.x, 2) + Math.pow(y - region.y, 2) + Math.pow(z - region.z, 2);
                    if (d2 < lastD2) {
                        regions.unshift(region);
                    } else {
                        regions.push(region);
                    }
                    lastD2 = d2;
                }
            }
            return regions;
        } else {
            console.warn("no cluster configuration defined.");
            throw new Error("No cluster configuration defined.");
        }
    }

    /**
     * Get closest region for coordinate.
     * @param x
     * @param y
     * @param z
     */
    public getRegion(x: number, y: number, z: number): string | undefined {
        if (this.clusterConfiguration) {
            const regions = Array<string>();
            let lastD2 = Number.MAX_SAFE_INTEGER;
            for (let region of this.clusterConfiguration!!.regions) {
                if (x >= region.x - region.edge / 2 && x <= region.x + region.edge / 2 &&
                    y >= region.y - region.edge / 2 && y <= region.y + region.edge / 2 &&
                    z >= region.z - region.edge / 2 && z <= region.z + region.edge / 2) {
                    const d2 = Math.pow(x - region.x, 2) + Math.pow(y - region.y, 2) + Math.pow(z - region.z, 2);
                    if (d2 < lastD2) {
                        regions.unshift(region.region);
                    } else {
                        regions.push(region.region);
                    }
                    lastD2 = d2;
                }
            }
            if (regions.length > 0) {
                return regions[0];
            } else {
                return undefined;
            }
        } else {
            console.warn("no cluster configuration defined.");
            throw new Error("No cluster configuration defined.");
        }
    }

    public getRegionConfiguration(region: string): RegionConfiguration {
        if (this.clusterConfiguration) {
            const clusterConfiguration = this.clusterConfiguration!!;
            for (const regionConfiguration of clusterConfiguration.regions) {
                if (regionConfiguration.region == region) {
                    return regionConfiguration;
                }
            }
            throw new Error("Region configuration not found: " + region);
        } else {
            console.warn("no cluster configuration defined.");
            throw new Error("No cluster configuration defined.");
        }
    }
}