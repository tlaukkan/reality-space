import {User} from "./User";
import {Group} from "./Group";
import {GroupPrivilege} from "./GroupPrivilege";
import {UserPrivilege} from "./UserPrivilege";
import {SerializableUser} from "./SerializableUser";
import {SerializableGroup} from "./SerializableGroup";

export class AccessSerializableModel {

    users: Array<SerializableUser> = new Array<SerializableUser>();
    groups: Array<SerializableGroup> = new Array<SerializableGroup>();
    groupPrivileges: Array<GroupPrivilege> = new Array<GroupPrivilege>();
    userPrivileges: Array<UserPrivilege> = new Array<UserPrivilege>();

}