import {Entity} from "./Entity";
import {Connection} from "./Connection";
import {Encode} from "../../common/reality/Encode";

class Cell {
    xi: number;
    yi: number;
    zi: number;
    entities: Array<Entity> = new Array<Entity>();
    cellsInRange: Array<Cell> = new Array<Cell>();

    constructor(xi: number, yi: number, zi: number) {
        this.xi = xi;
        this.yi = yi;
        this.zi = zi;
    }

    getEntityIndex(id: string): number {
        for (let index = 0; index < this.entities.length; index++) {
            if (this.entities[index].id === id) {
                return index;
            }
        }
        return -1;
    }

    addEntity(entity: Entity) {
        const index = this.getEntityIndex(entity.id);
        if (index === -1) {
            this.entities.push(entity);
        } else {
            throw new Error("Entity is already in cell: " + entity.id);
        }
    }

    removeEntity(id: string) {
        const index = this.getEntityIndex(id);
        if (index !== -1) {
            this.entities.splice(index, 1);
        } else {
            throw new Error("Entity is not in cell: " + id);
        }
    }
}

export class Grid {
    cx: number;
    cy: number;
    cz: number;
    edge: number;
    step: number;
    range: number;
    rangeInSteps: number;
    count: number;
    cells: Array<Array<Array<Cell>>>;
    entities: Map<String, Entity> = new Map();
    indexCounter: number = 0;
    unusedIndexes: Array<number> = new Array<number>();

    constructor(cx: number, cy: number, cz: number, edge: number, step: number, range: number) {
        this.cx = cx;
        this.cy = cy;
        this.cz = cz;
        this.edge = edge;
        this.step = step;
        this.range = range;
        this.rangeInSteps = this.range / this.step;

        this.count = this.edge / step;
        this.cells = new Array<Array<Array<Cell>>>(this.count);
        for (let xi = 0; xi < this.count; xi++) {
            this.cells[xi] = new Array<Array<Cell>>(this.count);
            for (let yi = 0; yi < this.count; yi++) {
                this.cells[xi][yi] = new Array<Cell>(this.count);
                for (let zi = 0; zi < this.count; zi++) {
                    this.cells[xi][yi][zi] = new Cell(xi, yi, zi);
                }
            }
        }
        for (let xi = 0; xi < this.count; xi++) {
            for (let yi = 0; yi < this.count; yi++) {
                for (let zi = 0; zi < this.count; zi++) {
                    this.addCellsInRange(this.cells[xi][yi][zi]);
                }
            }
        }
    }

    reserveIndex(): number {
        if (this.unusedIndexes.length > 0) {
            return this.unusedIndexes.pop()!!;
        } else {
            return this.indexCounter++;
        }
    }

    releaseIndex(index: number) {
        this.unusedIndexes.push(index);
    }

    add(connection: Connection, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string, type: string) : boolean {
        if (this.entities.get(id) !== undefined) {
            console.log(this.entities.get(id));
            throw Error("Entity already exists in grid: " + id);
        }
        const cell = this.getCell(x, y, z);
        if (cell !== undefined) {
            const entity = new Entity(connection, this.reserveIndex(), id, x, y, z, rx, ry, rz, rw, description, type);
            this.entities.set(id, entity);
            cell.addEntity(entity);

            if (entity.visible) { // Do not broadcast entities which are not visible (probes).
                this.queueToEntitiesInRange(entity, Encode.ADDED, Encode.added(entity.index, entity.id, x, y, z, rx, ry, rz, rw, description, type));
            }

            this.addEntitiesInRange(entity);

            return true;
        } else {
            return false;
        }


    }

    update(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) : boolean {
        const entity = this.entities.get(id);
        if (entity === undefined) {
            throw Error("Entity does not exist in grid: " + id);
        }
        const oldCell = this.getCell(entity.x, entity.y, entity.z);
        const newCell = this.getCell(x, y, z);

        if (oldCell === undefined) {
            throw Error("Entity old coordinates outside grid: " + id);
        }
        if (newCell === undefined) {
            return false;
        }

        if (oldCell !== newCell) {
            oldCell!!.removeEntity(id);

            // Notify removal between this entity and entities dropping out of range
            oldCell.cellsInRange.forEach((cellInRange: Cell) => {
                if (newCell.cellsInRange.indexOf(cellInRange) == -1) {
                    cellInRange.entities.forEach((entityInRange: Entity) => {
                        if (entityInRange.id != entity.id) {
                            if (entity.visible) {
                                this.queueToEntity(entityInRange, Encode.REMOVED, Encode.removed(entity.index, entity.id));
                            }
                            if (entityInRange.visible) {
                                this.queueToEntity(entity, Encode.REMOVED, Encode.removed(entityInRange.index, entityInRange.id));
                            }
                        }
                    });
                }
            });

        }

        entity.x = x;
        entity.y = y;
        entity.z = z;
        entity.rx = rx;
        entity.ry = ry;
        entity.rz = rz;
        entity.rw = rw;

        if (oldCell !== newCell) {
            newCell!!.addEntity(entity);

            // Notify addition between this entity and entities added to to range
            newCell.cellsInRange.forEach((cellInRange: Cell) => {
                if (oldCell.cellsInRange.indexOf(cellInRange) == -1) {
                    cellInRange.entities.forEach((entityInRange: Entity) => {
                        if (entityInRange.id != entity.id) {
                            if (entity.visible) {
                                this.queueToEntity(entityInRange, Encode.ADDED, Encode.added(entity.index, entity.id, entity.x, entity.y, entity.z, entity.rx, entity.ry, entity.rz, entity.rw, entity.description, entity.type));
                            }
                            if (entityInRange.visible) {
                                this.queueToEntity(entity, Encode.ADDED, Encode.added(entityInRange.index, entityInRange.id, entityInRange.x, entityInRange.y, entityInRange.z, entityInRange.rx, entityInRange.ry, entityInRange.rz, entityInRange.rw, entityInRange.description, entity.type));
                            }
                        }
                    });
                }
            });
        }

        if (entity.visible) { // Do not broadcast entities which are not visible (probes).
            this.queueToEntitiesInRange(entity, Encode.UPDATED, Encode.updated(entity.index, x, y, z, rx, ry, rz, rw));
        }

        return true;
    }

    describe(id: string, description: string) : void {
        const entity = this.entities.get(id);
        if (entity === undefined) {
            throw Error("Entity does not exist in grid: " + id);
        }
        entity.description = description;

        if (entity.visible) { // Do not broadcast entities which are not visible (probes).
            this.queueToEntitiesInRange(entity, Encode.DESCRIBED, Encode.described(entity.index, description));
        }
    }

    act(id: string, action: string, description: string) : void {
        const entity = this.entities.get(id);
        if (entity === undefined) {
            throw Error("Entity does not exist in grid: " + id);
        }
        if (entity.visible) { // Do not broadcast entities which are not visible (probes).
            this.queueToEntitiesInRange(entity, Encode.ACTED, Encode.acted(entity.index, action, description));
        }
    }

    notify(notification: string, description: string) : void {
        this.entities.forEach(entity => {
            this.queueToEntity(entity, Encode.NOTIFIED, Encode.notified(notification, description));
        })
    }

    remove(id: string) : void {
        const entity = this.entities.get(id);

        if (entity === undefined) {
            throw Error("Entity does not exist in grid: " + id);
        }

        const cell = this.getCell(entity.x, entity.y, entity.z);
        if (cell === undefined) {
            throw Error("Entity old coordinates outside grid: " + id);
        }

        if (entity.visible) { // Do not broadcast entities which are not visible (probes).
            this.queueToEntitiesInRange(entity, Encode.REMOVED, Encode.removed(entity.index, entity.id));
        }

        cell.removeEntity(id);
        this.entities.delete(id);
        this.releaseIndex(entity.index);
    }

    private addEntitiesInRange(entity: Entity) {
        if (!entity.observer) { return; }

        const cell = this.getCell(entity.x, entity.y, entity.z)
        if (cell === undefined) {
            throw Error("Entity old coordinates outside grid: " + entity.id);
        }
        for (let cellInRange of cell.cellsInRange) {
            for (let entityInRange of cellInRange.entities) {
                if (entityInRange.id === entity.id) {
                    continue;
                }
                if (!entityInRange.visible) { // Do not broadcast entities which are not visible (probes).
                    continue;
                }
                const encoded = Encode.added(entityInRange.index, entityInRange.id, entityInRange.x, entityInRange.y, entityInRange.z, entityInRange.rx, entityInRange.ry, entityInRange.rz, entityInRange.rw, entityInRange.description, entityInRange.type);
                this.queueToEntity(entity, Encode.ADDED, encoded);
            }
        }
    }


    public queueToEntitiesInRange(entity: Entity, messageType: string, encodedMessage: string) {
        const cell = this.getCell(entity.x, entity.y, entity.z);
        if (cell === undefined) {
            throw Error("Entity old coordinates outside grid: " + entity.id);
        }
        for (let cellInRange of cell.cellsInRange) {
            this.queueToCellEntities(cellInRange, messageType, encodedMessage);
        }
    }

    private queueToCellEntities(cell: Cell, messageType: string, encodedMessage: string) {
        for (let entity of cell.entities) {
            if (!entity.observer) { continue; }
            this.queueToEntity(entity, messageType, encodedMessage);
        }
    }

    private queueToEntity(entity: Entity, messageType: string, encodedMessage: string) {
        if (!entity.observer) { return; }

        if (entity.connection.outQueue.size() < 1000) {
            entity.connection.outQueue.enqueue([messageType, encodedMessage]);
        } else {
            console.warn("entity (" + entity.id + ") message queue full dropping message: " + messageType);
        }
    }

    addCellsInRange(a: Cell) {
        for (let xi = 0; xi < this.count; xi++) {
            for (let yi = 0; yi < this.count; yi++) {
                for (let zi = 0; zi < this.count; zi++) {
                    const b = this.cells[xi][yi][zi];
                    if (this.areInRange(a, b)) {
                        a.cellsInRange.push(b)
                    }
                }
            }
        }
    }

    areInRange(a: Cell, b: Cell) {
        return Math.sqrt((a.xi - b.xi) * (a.xi - b.xi) + (a.yi - b.yi) * (a.yi - b.yi) + (a.zi - b.zi) * (a.zi - b.zi)) <=
            this.rangeInSteps;
    }

    getCell(x: number, y: number, z: number): Cell | undefined {
        const xi = Math.floor((x - (this.cx - this.edge / 2)) / this.step);
        const yi = Math.floor((y - (this.cy - this.edge / 2)) / this.step);
        const zi = Math.floor((z - (this.cz - this.edge / 2)) / this.step);
        if (xi < 0 || xi > this.count - 1  ||
            yi < 0 || yi > this.count - 1 ||
            zi < 0 || zi > this.count - 1) {
            return undefined;
        }
        return this.cells[xi][yi][zi];
    }
}
