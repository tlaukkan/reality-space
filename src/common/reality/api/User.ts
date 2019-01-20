export class User {
    id: string;
    name: string;
    groupNames: Array<string>;

    constructor(id: string, name: string, groupNames: Array<string>) {
        this.id = id;
        this.name = name;
        this.groupNames = groupNames;
    }
}