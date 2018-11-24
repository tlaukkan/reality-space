export class SerializableGroup {

    name: string;
    userIds: Array<string>;

    constructor(name: string, userIds: Array<string>) {
        this.name = name;
        this.userIds = userIds;
    }

}