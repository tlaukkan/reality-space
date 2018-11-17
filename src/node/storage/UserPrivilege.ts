import {User} from "./User";
import {Group} from "./Group";
import {PrivilegeType} from "./PrivilegeType";

export class UserPrivilege {
    type: PrivilegeType;
    userId: string;
    sid: string;

    constructor(type: PrivilegeType, userId: string, sid: string) {
        this.type = type;
        this.userId = userId;
        this.sid = sid;
    }
}