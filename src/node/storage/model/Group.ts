export class Group {

    name: string;
    userIds: Set<string> = new Set<string>();

    constructor(name: string, userIds: Set<string>) {
        this.name = name;
        this.userIds= userIds;
    }

}