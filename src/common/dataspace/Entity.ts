import {Connection} from "./Connection";

export class Entity {
    connection: Connection;
    index: number;
    id: string;
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
    rw: number;
    description: string;

    constructor(connection: Connection, index: number, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string) {
        this.connection = connection;
        this.index = index;
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
        this.rw = rw;
        this.description = description;
    }
}