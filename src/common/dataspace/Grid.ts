import {Entity} from "./Entity";
import {Connection} from "./Connection";
import {Encode} from "./Encode";

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

    add(connection: Connection, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string) : boolean {
        if (this.entities.get(id) !== undefined) {
            console.log(this.entities.get(id));
            throw Error("Entity already exists in grid: " + id);
        }
        const cell = this.getCell(x, y, z);
        if (cell !== undefined) {
            const entity = new Entity(connection, this.reserveIndex(), id, x, y, z, rx, ry, rz, rw, description);
            this.entities.set(id, entity);
            cell.addEntity(entity);
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
            newCell!!.addEntity(entity);
        }

        entity.x = x;
        entity.y = y;
        entity.z = z;
        entity.rx = rx;
        entity.ry = ry;
        entity.rz = rz;
        entity.rw = rw;

        return true;
    }

    describe(id: string, description: string) : void {
        const entity = this.entities.get(id);
        if (entity === undefined) {
            throw Error("Entity does not exist in grid: " + id);
        }
        entity.description = description;
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
        cell.removeEntity(id);
        this.entities.delete(id);
        this.releaseIndex(entity.index);
    }

    queue(entityId: string, messageType: string, encodedMessage: string) {
        const entity = this.entities.get(entityId);
        if (entity === undefined) {
            throw Error("Entity does not exist in grid: " + entityId);
        }
        const cell = this.getCell(entity.x, entity.y, entity.z);
        if (cell === undefined) {
            throw Error("Entity old coordinates outside grid: " + entityId);
        }
        for (let cellInRange of cell.cellsInRange) {
            for (let entityInRange of cellInRange.entities) {
                if (entityInRange.connection.outQueue.size() < 1000) {
                    entityInRange.connection.outQueue.enqueue([messageType, encodedMessage]);
                } else {
                    console.warn("entity (" + entity.id + ") message queue full dropping message: " + messageType);
                }
            }
        }
    }

    addEntitiesInRange(entityId: string) {
        const entity = this.entities.get(entityId);
        if (entity === undefined) {
            throw Error("Entity does not exist in grid: " + entityId);
        }
        const cell = this.getCell(entity.x, entity.y, entity.z)
        if (cell === undefined) {
            throw Error("Entity old coordinates outside grid: " + entityId);
        }
        for (let cellInRange of cell.cellsInRange) {
            for (let entityInRange of cellInRange.entities) {
                if (entityInRange.id === entityId) {
                    continue;
                }
                if (!entity.visible) { // Do not broadcast entities which are not visible (probes).
                    continue;
                }
                const encoded = Encode.added(entityInRange.index, entityInRange.id, entityInRange.x, entityInRange.y, entityInRange.z, entityInRange.rx, entityInRange.ry, entityInRange.rz, entityInRange.rw, entityInRange.description);
                entity.connection.outQueue.enqueue([Encode.ADDED, encoded]);
            }
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
