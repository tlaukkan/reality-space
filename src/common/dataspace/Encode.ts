export class Encode {

    static readonly SEPARATOR: string = '|';

    static readonly ADD: string = 'A';
    static readonly ADDED: string = 'a';
    static readonly UPDATE: string = 'U';
    static readonly UPDATED: string = 'u';
    static readonly REMOVE: string = 'R';
    static readonly REMOVED: string = 'r';
    static readonly DESCRIBE: string = 'D';
    static readonly DESCRIBED: string = 'd';
    static readonly ACT: string = 'C';
    static readonly ACTED: string = 'c';
    static readonly NOTIFY: string = 'N';
    static readonly NOTIFIED: string = 'n';

    static readonly NOTIFICATION_STORED_ENTITY_CHANGED: string = 'su';
    static readonly NOTIFICATION_STORED_ENTITY_REMOVED: string = 'sr';

    static readonly OBJECT: string = 'o'; // Visible
    static readonly PROBE: string = 'p';  // Observing
    static readonly AVATAR: string = 'a'; // Visible and observing

    static add(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string, type: string) : string {
        return "" +
            s(this.ADD) +
            s(id) +
            d2(x) +
            d2(y) +
            d2(z) +
            d2(rx) +
            d2(ry) +
            d2(rz) +
            d2(rw) +
            se(description) +
            s(type);
    }

    static added(index: number, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string, type: string) : string {
        return "" +
            s(this.ADDED) +
            i(index) +
            s(id) +
            d2(x) +
            d2(y) +
            d2(z) +
            d2(rx) +
            d2(ry) +
            d2(rz) +
            d2(rw) +
            se(description) +
            s(type);
    }

    static update(id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) : string {
        return "" +
            s(this.UPDATE) +
            s(id) +
            d2(x) +
            d2(y) +
            d2(z) +
            d2(rx) +
            d2(ry) +
            d2(rz) +
            d2(rw);
    }

    static updated(index: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) : string {
        return "" +
            s(this.UPDATED) +
            i(index) +
            d2(x) +
            d2(y) +
            d2(z) +
            d2(rx) +
            d2(ry) +
            d2(rz) +
            d2(rw);
    }

    static remove(id: string) : string {
        return "" +
            s(this.REMOVE) +
            s(id);
    }

    static removed(index: number, id: string) : string {
        return "" +
            s(this.REMOVED) +
            i(index) +
            s(id);
    }

    static describe(id: string, description: string) : string {
        return "" +
            s(this.DESCRIBE) +
            s(id) +
            se(description);
    }

    static described(index: number, description: string) : string {
        return "" +
            s(this.DESCRIBED) +
            i(index) +
            se(description);
    }

    static act(id: string, action: string, description: string) : string {
        return "" +
            s(this.ACT) +
            s(id) +
            s(action) +
            se(description);
    }

    static acted(index: number, action: string, description: string) : string {
        return "" +
            s(this.ACTED) +
            i(index) +
            s(action) +
            se(description);
    }

    static notify(notification: string, description: string) : string {
        return "" +
            s(this.NOTIFY) +
            s(notification) +
            se(description);
    }

    static notified(notification: string, description: string) : string {
        return "" +
            s(this.NOTIFIED) +
            s(notification) +
            se(description);
    }

}

function s(value: string): string {
    return value + Encode.SEPARATOR;
}

function se(value: string): string {
    return value.replace("\\","\\\\1").replace(Encode.SEPARATOR,"\\\\2") + Encode.SEPARATOR;
}

function i(value: number): string {
    return value + Encode.SEPARATOR;
}

function d1(value: number): string {
    return value.toFixed(1) + Encode.SEPARATOR;
}

function d2(value: number): string {
    return value.toFixed(2) + Encode.SEPARATOR;
}
