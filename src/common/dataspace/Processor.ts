import {Connection} from "./Connection";
import {Grid} from "./Grid";
import {Encode} from "./Encode";
import {Decode} from "./Decode";
import Timer = NodeJS.Timer;

export class Processor {

    static readonly UPDATE_INTERVAL_MILLIS: number = 300;
    static readonly TICK_INTERVAL_MILLIS: number = 5;
    static readonly TICKS_PER_UPDATE_INTERVAL: number = Processor.UPDATE_INTERVAL_MILLIS / Processor.TICK_INTERVAL_MILLIS;

    grid: Grid;
    connections: Map<string, Connection> = new Map();
    intervalHandle: Timer | undefined = undefined;
    lastProcessTime: number = new Date().getTime();

    constructor(grid: Grid) {
        this.grid = grid;
    }

    start() {
        this.intervalHandle = setInterval(this.tick, Processor.TICK_INTERVAL_MILLIS);
    }

    stop() {
        if (this.intervalHandle !== undefined) {
            clearInterval(this.intervalHandle);
        }
        this.intervalHandle = undefined;
    }

    tick = () => {
        try {
            const currentProcessTime: number = new Date().getTime()
            const delta = currentProcessTime - this.lastProcessTime;
            //console.log("processing, delta: " + delta + " ms.")
            this.connections.forEach((connection: Connection, id: string) => {
                const queueSize = connection.outQueue.size();
                const toSendInThisTick = Math.ceil(queueSize / Processor.TICKS_PER_UPDATE_INTERVAL);

                //console.log("Sending for " + connection.id + " " + toSendInThisTick + "/" + queueSize);
                for (let i = 0; i < toSendInThisTick; i++) {
                    const typeAndMessage = connection.outQueue.dequeue()!!;
                    const type: string = typeAndMessage[0];
                    const message: string = typeAndMessage[1];
                    connection.send(message);
                }
            });
            this.lastProcessTime = currentProcessTime;
        } catch (error) {
            console.error("Error in control process loop.", error);
        }
    }

    add(connection: Connection) {
        this.connections.set(connection.id, connection);

        connection.receive = (message: String) => {
            try {
                const parts = message.split(Encode.SEPARATOR);
                const type = parts[0];
                if (type === Encode.ADD) {
                    const decoded = Decode.add(parts);
                    const entityId = decoded[0];
                    const x: number = decoded[1];
                    const y: number = decoded[2];
                    const z: number = decoded[3];
                    const rx: number = decoded[4];
                    const ry: number = decoded[5];
                    const rz: number = decoded[6];
                    const rw: number = decoded[7];
                    const description = decoded[8];

                    if (connection.entityIds.has(entityId)) {
                        throw new Error("Connection already owns: " + entityId);
                    }

                    const success = this.grid.add(connection, entityId, x, y, z, rx, ry, rz, rw, description);

                    if (!success) {
                        console.warn("Failed to add entity to grid due to entity being outside grid boundaries: ", message);
                        return;
                    }

                    connection.entityIds.add(entityId);
                    const entity = this.grid.entities.get(entityId);
                    const encoded = Encode.added(entity.index, entityId, x, y, z, rx, ry, rz, rw, description);
                    this.grid.queue(entityId, Encode.ADDED, encoded);

                    this.grid.addEntitiesInRange(entityId);
                    return;
                }
                if (type === Encode.UPDATE) {
                    const decoded = Decode.update(parts);
                    const entityId = decoded[0];
                    const x: number = decoded[1];
                    const y: number = decoded[2];
                    const z: number = decoded[3];
                    const rx: number = decoded[4];
                    const ry: number = decoded[5];
                    const rz: number = decoded[6];
                    const rw: number = decoded[7];

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    this.grid.update(entityId, x, y, z, rx, ry, rz, rw);
                    const entity = this.grid.entities.get(entityId);
                    const encoded = Encode.updated(entity.index, x, y, z, rx, ry, rz, rw);
                    this.grid.queue(entityId, Encode.UPDATED, encoded);
                    return;
                }
                if (type === Encode.REMOVE) {
                    const decoded = Decode.remove(parts);
                    const entityId = decoded[0];

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    const entity = this.grid.entities.get(entityId);
                    const encoded = Encode.removed(entity.index, entityId);
                    this.grid.queue(entityId, Encode.REMOVED, encoded);
                    connection.entityIds.delete(entityId);
                    this.grid.remove(entityId);
                    return;
                }
                if (type === Encode.DESCRIBE) {
                    const decoded = Decode.describe(parts);
                    const entityId = decoded[0];
                    const description = decoded[1];

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    this.grid.describe(entityId, description);

                    const entity = this.grid.entities.get(entityId);
                    const encoded = Encode.described(entity.index, description);
                    this.grid.queue(entityId, Encode.DESCRIBED, encoded);
                    return;
                }
                if (type === Encode.ACT) {
                    const decoded = Decode.act(parts);
                    const entityId = decoded[0];
                    const action = decoded[1];

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    const entity = this.grid.entities.get(entityId);
                    const encoded = Encode.acted(entity.index, action);
                    this.grid.queue(entityId, Encode.ACTED, encoded);
                    return;
                }
            } catch (error) {
                console.warn("Message processing failed: " + message, error);
            }

        }

    }

    remove(connection: Connection) {
        this.connections.delete(connection.id);

        for (let entityId of connection.entityIds) {
            const entity = this.grid.entities.get(entityId);
            const encoded = Encode.removed(entity.index, entityId);
            this.grid.queue(entityId, Encode.REMOVED, encoded);
            connection.entityIds.delete(entityId);
            this.grid.remove(entityId);
        }
    }


}