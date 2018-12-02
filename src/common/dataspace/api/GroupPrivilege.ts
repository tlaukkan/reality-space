import {PrivilegeType} from "./PrivilegeType";

export class GroupPrivilege {
    type: PrivilegeType;
    name: string;
    sid: string;

    constructor(type: PrivilegeType, name: string, sid: string) {
        this.type = type;
        this.name = name;
        this.sid = sid;
    }
}