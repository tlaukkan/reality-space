import {User} from "./User";
import {Group} from "./Group";
import {GroupPrivilege} from "./GroupPrivilege";
import {UserPrivilege} from "./UserPrivilege";

export class AccessModel {

    users: Map<String, User> = new Map<String, User>();
    groups: Map<String, Group> = new Map<String, Group>();
    groupPrivileges: Map<string, Map<String, GroupPrivilege>> = new Map<string, Map<String, GroupPrivilege>>();
    userPrivileges: Map<string, Map<String, UserPrivilege>> = new Map<string, Map<String, UserPrivilege>>();

}