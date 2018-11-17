export class User {

    id: string;
    name: string;
    groupNames: Set<string> = new Set<string>();

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

}