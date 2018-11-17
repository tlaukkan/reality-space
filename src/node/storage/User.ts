export class User {

    id: string;
    name: string;
    groupNames: Set<string>;

    constructor(id: string, name: string, groupNames: Set<string>) {
        this.id = id;
        this.name = name;
        this.groupNames = groupNames;
    }

}