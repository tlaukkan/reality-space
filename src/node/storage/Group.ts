export class Group {

    name: string;
    userIds: Set<string> = new Set<string>();

    constructor(name: string) {
        this.name = name;
    }

}