import {PrivilegeType} from "./PrivilegeType";
import {User} from "./User";
import {Group} from "./Group";

export interface AccessManagement {
    hasPrivilege(userId: string, sid: string, type: PrivilegeType): boolean;

    getResourceGroupPrivileges(sid: string): Array<[string, PrivilegeType]>;

    getResourceUserPrivileges(sid: string): Array<[string, string, PrivilegeType]>;

    getGroupPrivileges(groupName: string): Array<[string, PrivilegeType]>;

    getUserPrivileges(userId: string): Array<[string, PrivilegeType]>;

    getPrivilegeLevel(type: PrivilegeType): number;

    setGroupPrivilege(groupName: string, type: PrivilegeType, sid: string): void;

    removeGroupPrivilege(groupName: string, sid: string): void;

    removeSid(sid: string): void;

    setUserPrivilege(userId: string, type: PrivilegeType, sid: string): void;

    removeUserPrivilege(userId: string, sid: string): void;

    addUser(userId: string, userName: string): void;

    updateUser(userId: string, userName: string): void;

    removeUser(userId: string): void;

    hasUser(id: string): boolean;

    getUser(id: string): User;

    addGroup(groupName: string): void;

    addGroupMember(groupName: string, userId: string): void;

    removeGroupMember(groupName: string, userId: string): void;

    removeGroup(groupName: string): void;

    hasGroup(name: string): boolean;

    getGroup(name: string): Group;
}