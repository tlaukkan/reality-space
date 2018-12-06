import {AccessModel} from "./model/AccessModel";
import {User} from "./model/User";
import {Group} from "./model/Group";
import {PrivilegeType} from "./model/PrivilegeType";
import {GroupPrivilege} from "./model/GroupPrivilege";
import {UserPrivilege} from "./model/UserPrivilege";
import {AccessSerializableModel} from "./model/AccessSerializableModel";
import {SerializableUser} from "./model/SerializableUser";
import {SerializableGroup} from "./model/SerializableGroup";

export class AccessController {

    model: AccessModel = new AccessModel();

    clear(): void {
        this.model = new AccessModel();
    }

    init(): void {
        this.addUser("anonymous", "anonymous");
        this.setUserPrivilege("anonymous", PrivilegeType.VIEW, "");

        this.addGroup("administrators");
        this.setGroupPrivilege("administrators", PrivilegeType.ADMIN, "");

        this.addGroup("modifiers");
        this.setGroupPrivilege("modifiers", PrivilegeType.MODIFY, "");

        this.addGroup("users");
        this.setGroupPrivilege("users", PrivilegeType.USE, "");

        this.addGroup("viewers");
        this.setGroupPrivilege("viewers", PrivilegeType.VIEW, "");
    }

    checkPrivilege(userId: string, sid: string, type: PrivilegeType): void {
        if (!this.hasPrivilege(userId, sid, type)) {
            throw new Error(userId + " " + type + " access denied to " + sid);
        }
    }

    hasPrivilege(userId: string, sid: string, type: PrivilegeType): boolean {

        if (!this.model.users.has(userId)) {
            throw new Error("User doest not exist: " + userId);
        }

        if (this.model.userPrivileges.has(sid)) {
            if (this.model.userPrivileges.get(sid)!!.has(userId)) {
                let userPrivilegeType = this.model.userPrivileges.get(sid)!!.get(userId)!!.type;
                if (this.getPrivilegeLevel(userPrivilegeType) >= this.getPrivilegeLevel(type)) {
                    return true;
                }
            }
        }

        const user = this.model.users.get(userId)!!;
        let found = false;
        user.groupNames.forEach((groupName) => {
            if (this.model.groupPrivileges.has(sid)) {
                if (this.model.groupPrivileges.get(sid)!!.has(groupName)) {
                    let groupPrivilegeType = this.model.groupPrivileges.get(sid)!!.get(groupName)!!.type;
                    if (this.getPrivilegeLevel(groupPrivilegeType) >= this.getPrivilegeLevel(type)) {
                        found = true;
                        return;
                    }
                }
            }
        });

        return found;
    }

    getResourceGroupPrivileges(sid: string): Array<[string, PrivilegeType]> {
        const privileges: Array<[string, PrivilegeType]> = new Array<[string, PrivilegeType]>();
        if (this.model.groupPrivileges.has(sid)) {
            this.model.groupPrivileges.get(sid);
            this.model.groupPrivileges.get(sid)!!.forEach((groupPrivilege) => {
                privileges.push([groupPrivilege.name, groupPrivilege.type]);
            });
        }
        return privileges;
    }

    getResourceUserPrivileges(sid: string): Array<[string, string, PrivilegeType]> {
        const privileges: Array<[string, string, PrivilegeType]> = new Array<[string, string, PrivilegeType]>();
        if (this.model.userPrivileges.has(sid)) {
            this.model.userPrivileges.get(sid)!!.forEach((userPrivilege) => {
                const user = this.model.users.get(userPrivilege.userId)!!;
                privileges.push([user.id, user.name, userPrivilege.type]);
            });
        }
        return privileges;
    }

    getGroupPrivileges(groupName: string): Array<[string, PrivilegeType]> {
        if (!this.model.groups.has(groupName)) {
            throw new Error("Group doest not exist: " + groupName);
        }
        const privileges: Array<[string, PrivilegeType]> = new Array<[string, PrivilegeType]>();
        this.model.groupPrivileges.forEach((groupPrivileges) => {
            if (groupPrivileges.has(groupName)) {
                const groupPrivilege = groupPrivileges.get(groupName)!!;
                privileges.push([groupPrivilege.sid, groupPrivilege.type]);
            }
        });
        return privileges;
    }

    getUserPrivileges(userId: string): Array<[string, PrivilegeType]> {
        if (!this.model.users.has(userId)) {
            throw new Error("User doest not exist: " + userId);
        }

        const privileges: Array<[string, PrivilegeType]> = new Array<[string, PrivilegeType]>();
        this.model.userPrivileges.forEach((userPrivileges) => {
            if (userPrivileges.has(userId)) {
                const userPrivilege = userPrivileges.get(userId)!!;
                privileges.push([userPrivilege.sid, userPrivilege.type]);
            }
        });
        return privileges;
    }

    getPrivilegeLevel(type: PrivilegeType): number {
        if (type == PrivilegeType.ADMIN) {
            return 4;
        }
        if (type == PrivilegeType.MODIFY) {
            return 3;
        }
        if (type == PrivilegeType.USE) {
            return 2;
        }
        if (type == PrivilegeType.VIEW) {
            return 1;
        }
        return 0;
    }

    setGroupPrivilege(groupName: string, type: PrivilegeType, sid: string) {
        if (!this.model.groups.has(groupName)) {
            throw new Error("Group doest not exist: " + groupName);
        }
        if (!this.model.groupPrivileges.has(sid)) {
            this.model.groupPrivileges.set(sid, new Map<String, GroupPrivilege>());
        }
        this.model.groupPrivileges.get(sid)!!.set(groupName,
            new GroupPrivilege(type, groupName, sid));
    }

    removeGroupPrivilege(groupName: string, sid: string) {
        if (!this.model.groups.has(groupName)) {
            throw new Error("Group doest not exist: " + groupName);
        }
        if (!this.model.groupPrivileges.has(sid)) {
            this.model.groupPrivileges.set(sid, new Map<String, GroupPrivilege>());
        }
        this.model.groupPrivileges.get(sid)!!.delete(groupName);
    }

    removeSid(sid: string) {
        this.model.groupPrivileges.delete(sid);
        this.model.userPrivileges.delete(sid);
    }

    setUserPrivilege(userId: string, type: PrivilegeType, sid: string) {
        if (!this.model.users.has(userId)) {
            throw new Error("User doest not exist: " + userId);
        }
        if (!this.model.userPrivileges.has(sid)) {
            this.model.userPrivileges.set(sid, new Map<String, UserPrivilege>());
        }
        this.model.userPrivileges.get(sid)!!.set(userId,
            new UserPrivilege(type, userId, sid));
    }

    removeUserPrivilege(userId: string, sid: string) {
        if (!this.model.users.has(userId)) {
            throw new Error("User doest not exist: " + userId);
        }
        if (!this.model.userPrivileges.has(sid)) {
            this.model.userPrivileges.set(sid, new Map<String, UserPrivilege>());
        }
        this.model.userPrivileges.get(sid)!!.delete(userId);
    }

    addUser(userId: string, userName: string) {
        if (!this.model.users.has(userId)) {
            this.model.users.set(userId, new User(userId, userName, new Set<string>()));
        } else {
            throw new Error("User already exists: " + userId);
        }
    }

    updateUser(userId: string, userName: string) {
        if (this.model.users.has(userId)) {
            this.model.users.get(userId)!!.name = userName;
        } else {
            throw new Error("User doest not exist: " + userId);
        }
    }

    removeUser(userId: string) {
        if (this.model.users.has(userId)) {
            this.model.users.get(userId)!!.groupNames.forEach((groupName) => {
                this.removeGroupMember(groupName, userId);
            });
            this.getUserPrivileges(userId).forEach(([sid, type]) => {
                this.removeUserPrivilege(userId, sid);
            });
            this.model.users.delete(userId);
        } else {
            throw new Error("User doest not exist: " + userId);
        }
    }

    hasUser(id: string) {
        return this.model.users.has(id);
    }

    getUser(id: string): User {
        if (this.model.users.has(id)) {
            return this.model.users.get(id)!!;
        } else {
            throw new Error("User doest not exist: " + id);
        }
    }

    addGroup(groupName: string) {
        if (!this.model.groups.has(groupName)) {
            this.model.groups.set(groupName, new Group(groupName, new Set<string>()));
        } else {
            throw new Error("Group already exists: " + groupName);
        }
    }

    addGroupMember(groupName: string, userId: string) {
        if (!this.model.users.has(userId)) {
            throw new Error("User doest not exist: " + userId);
        }
        if (!this.model.groups.has(groupName)) {
            throw new Error("Group doest not exist: " + groupName);
        }
        this.model.groups.get(groupName)!!.userIds.add(userId);
        this.model.users.get(userId)!!.groupNames.add(groupName);
    }

    removeGroupMember(groupName: string, userId: string) {
        if (!this.model.users.has(userId)) {
            throw new Error("User doest not exist: " + userId);
        }
        if (!this.model.groups.has(groupName)) {
            throw new Error("Group doest not exist: " + groupName);
        }
        this.model.groups.get(groupName)!!.userIds.delete(userId);
        this.model.users.get(userId)!!.groupNames.delete(groupName);
    }

    removeGroup(groupName: string) {
        if (this.model.groups.has(groupName)) {
            this.model.groups.get(groupName)!!.userIds.forEach((userId) => {
                this.removeGroupMember(groupName, userId);
            });
            this.getGroupPrivileges(groupName).forEach(([sid, privilegeType]) => {
                this.removeGroupPrivilege(groupName, sid);
            });

            this.model.groups.delete(groupName);
        } else {
            throw new Error("Group doest not exist: " + groupName);
        }
    }

    hasGroup(name: string) {
        return this.model.groups.has(name);
    }

    getGroup(name: string): Group {
        if (this.model.groups.has(name)) {
            return this.model.groups.get(name)!!;
        } else {
            throw new Error("Group doest not exist: " + name);
        }
    }

    serialize(): string{
        const serializableModel = new AccessSerializableModel();
        serializableModel.users = [...this.model.users.values()].map(user => {
                return new SerializableUser(user.id, user.name, [...user.groupNames]);
            }
        );
        serializableModel.groups = [...this.model.groups.values()].map(group => {
            return new SerializableGroup(group.name, [...group.userIds]);
        });
        this.model.userPrivileges.forEach(userPrivileges => {
            userPrivileges.forEach(userPrivilege => {
                serializableModel.userPrivileges.push(userPrivilege);
            })
        });
        this.model.groupPrivileges.forEach(groupPrivileges => {
            groupPrivileges.forEach(groupPrivilege => {
                serializableModel.groupPrivileges.push(groupPrivilege);
            })
        });
        return JSON.stringify(serializableModel, null, '  ');
    }

    deserialize(serializedAccessModel: string) {
        const accessModel = new AccessModel();
        const serializableModel = JSON.parse(serializedAccessModel) as AccessSerializableModel;

        serializableModel.users.forEach(user => {
           const groupNames: Set<string> = new Set<string>();
           [...user.groupNames as any].forEach(groupName => {
                groupNames.add(groupName);
           });
           accessModel.users.set(user.id, new User(user.id, user.name, groupNames));
        });

        serializableModel.groups.forEach(group => {
            const userIds: Set<string> = new Set<string>();
            [...group.userIds].forEach(userId => {
               userIds.add(userId);
            });
            accessModel.groups.set(group.name, new Group(group.name, userIds));
        });

        serializableModel.userPrivileges.forEach(privilege => {
           if (!accessModel.userPrivileges.has(privilege.sid)) {
               accessModel.userPrivileges.set(privilege.sid, new Map<String, UserPrivilege>());
           }
           accessModel.userPrivileges.get(privilege.sid)!!.set(privilege.userId, privilege);
        });

        serializableModel.groupPrivileges.forEach(privilege => {
            if (!accessModel.groupPrivileges.has(privilege.sid)) {
                accessModel.groupPrivileges.set(privilege.sid, new Map<String, GroupPrivilege>());
            }
            accessModel.groupPrivileges.get(privilege.sid)!!.set(privilege.name, privilege);
        });

        this.model = accessModel;
    }

}