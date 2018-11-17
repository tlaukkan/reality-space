import {User} from "./User";
import {Group} from "./Group";
import {GroupPrivilege} from "./GroupPrivilege";
import {UserPrivilege} from "./UserPrivilege";

export class AccessSerializableModel {

    users: Array<User> = new Array<User>();
    groups: Array<Group> = new Array<Group>();
    groupPrivileges: Array<GroupPrivilege> = new Array<GroupPrivilege>();
    userPrivileges: Array<UserPrivilege> = new Array<UserPrivilege>();

}