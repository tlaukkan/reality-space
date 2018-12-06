import {Connection} from "./Connection";
import {Encode} from "../../common/dataspace/Encode";

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
    type: string;
    visible: boolean;
    observer: boolean;

    constructor(connection: Connection, index: number, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string, type: string) {
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
        this.type = type;
        this.visible = type == Encode.AVATAR || type == Encode.OBJECT;
        this.observer = type == Encode.AVATAR || type == Encode.PROBE;
    }
}