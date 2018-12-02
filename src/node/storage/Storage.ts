import {AccessController} from "./AccessController";
import {SceneController} from "./SceneController";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {Repository} from "./repository/Repository";
import {PrivilegeType} from "./model/PrivilegeType";
import {User} from "./model/User";
import {Group} from "./model/Group";
import {Principal} from "../framework/rest/Principal";
import {info} from "../util/log";

export class Storage {

    private readonly sceneFileName: string;
    private readonly accessFileName: string;

    accessController: AccessController;
    sceneController: SceneController;
    repository: Repository;

    constructor(sceneFileName: string, accessFileName: string, repository: Repository, sanitizer: Sanitizer) {
        this.sceneFileName = sceneFileName;
        this.accessFileName = accessFileName;
        this.repository = repository;
        this.accessController = new AccessController();
        this.sceneController = new SceneController(sanitizer);
    }

    async startup() {
        await this.load();
    }

    clear() {
        this.sceneController.clear();
        this.accessController.clear();
    }

    init() {
        this.accessController.init();
    }

    async load() {
        const sceneContent = await this.repository.load(this.sceneFileName);
        if (sceneContent.length > 0) {
            this.sceneController.deserialize(sceneContent);
        }
        const accessContent = await this.repository.load(this.accessFileName);
        if (accessContent.length > 0) {
            this.accessController.deserialize(accessContent);
        } else {
            this.accessController.init();
            await this.save();
        }
    }

    async shutdown() {
        await this.save();
    }

    async save() {
        const sceneContent = await this.sceneController.serialize();
        await this.repository.save(this.sceneFileName, sceneContent);
        const accessContent = await this.accessController.serialize();
        await this.repository.save(this.accessFileName, accessContent);
    }

    // Scene

    getScene(context: Principal): string {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.VIEW);
        return this.sceneController.getScene();
    }

    saveSceneFragment(context: Principal, sceneFragment: string): string {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.MODIFY);
        info(context, "saved scene fragment: " + sceneFragment);
        return this.sceneController.saveSceneFragment(sceneFragment);
    }

    removeSceneFragment(context: Principal, sceneFragment: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.MODIFY);
        this.sceneController.removeSceneFragment(sceneFragment);
        info(context, "removed scene fragment: " + sceneFragment);
    }

    // Users

    getUsers(context: Principal) : Array<User> {
        return Array.from(this.accessController.model.users.values());
    }

    getUser(context: Principal, id: string): User | undefined {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        if (this.accessController.hasUser(id)) {
            return this.accessController.getUser(id);
        } else {
            return undefined;
        }
    }

    addUser(context: Principal, id: string, userName: string): User {
        if (this.accessController.getGroup("administrators").userIds.size > 0) {
            // Omit admin check if no admins exist in admin group.
            this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        }

        this.accessController.addUser(id, userName);
        info(context, "user " + id + " added with name : '" + userName + "'");
        // Add user as viewer if viewers group exists.
        if (this.accessController.hasGroup("viewers")) {
            this.accessController.addGroupMember("viewers", id);
            info(context, "user " + id + " added to viewers group.");
        }

        // Add user as administrator if no administrators exist in administrator group.
        if (this.accessController.hasGroup("administrators")) {
            if (this.accessController.getGroup("administrators").userIds.size == 0) {
                this.accessController.addGroupMember("administrators", id);
                info(context, "user " + id + " added as first administrator to administrators group.");
            }
        }

        return this.accessController.getUser(id);
    }

    updateUser(context: Principal, id: string, userName: string): User {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.updateUser(id, userName);
        info(context, "user " + id + " updated with name : '" + userName + "'");

        return this.accessController.getUser(id);
    }

    removeUser(context: Principal, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUser(userId);
        info(context, "user " + userId + " removed.");
    }

    // Groups

    getGroups(context: Principal): Array<Group> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return Array.from(this.accessController.model.groups.values());
    }

    getGroup(context: Principal, name: string): Group | undefined {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        if (this.accessController.hasGroup(name)) {
            return this.accessController.getGroup(name);
        } else {
            return undefined;
        }
    }

    addGroup(context: Principal, groupName: string): Group {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroup(groupName);
        info(context, "group '" + groupName + "' added.");
        return this.accessController.getGroup(groupName);
    }

    removeGroup(context: Principal, groupName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroup(groupName);
        info(context, "group '" + groupName + "' removed.");
    }

    // Group members

    addGroupMember(context: Principal, groupName: string, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroupMember(groupName, userId);
        info(context, "user " + userId + " added to " + groupName + " group.");
    }

    removeGroupMember(context: Principal, groupName: string, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupMember(groupName, userId);
        info(context, "user " + userId + " removed from " + groupName + " group.");
    }

    // Privileges

    getGroupPrivileges(context: Principal, groupName: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getGroupPrivileges(groupName);
    }

    getUserPrivileges(context: Principal, userId: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getUserPrivileges(userId);
    }

    setGroupPrivilege(context: Principal, groupName: string, type: PrivilegeType, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.setGroupPrivilege(groupName, type, sid);
    }

    setUserPrivilege(context: Principal, userId: string, type: PrivilegeType, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.setUserPrivilege(userId, type, sid);
    }

    removeGroupPrivilege(context: Principal, groupName: string, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupPrivilege(groupName, sid);
    }

    removeUserPrivilege(context: Principal, userId: string, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUserPrivilege(userId, sid);
    }

}