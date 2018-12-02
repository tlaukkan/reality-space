export class Group {

    name: string;
    userIds: Array<string> = new Array<string>();

    constructor(name: string, userIds: Array<string>) {
        this.name = name;
        this.userIds= userIds;
    }

}