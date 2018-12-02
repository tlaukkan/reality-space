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

    private accessController: AccessController;
    private sceneController: SceneController;
    private repository: Repository;

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

    async load() {
        const sceneContent = await this.repository.load(this.sceneFileName);
        if (sceneContent.length > 0) {
            this.sceneController.deserialize(sceneContent);
        }
        const accessContent = await this.repository.load(this.accessFileName);
        if (accessContent.length > 0) {
            this.accessController.deserialize(accessContent);
        } else {
            this.accessController.addUser("anonymous", "anonymous");
            this.accessController.setUserPrivilege("anonymous", PrivilegeType.VIEW, "");

            this.accessController.addGroup("administrators");
            this.accessController.setGroupPrivilege("administrators", PrivilegeType.ADMIN, "");

            this.accessController.addGroup("modifiers");
            this.accessController.setGroupPrivilege("modifiers", PrivilegeType.MODIFY, "");

            this.accessController.addGroup("users");
            this.accessController.setGroupPrivilege("users", PrivilegeType.USE, "");

            this.accessController.addGroup("viewers");
            this.accessController.setGroupPrivilege("viewers", PrivilegeType.VIEW, "");
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
        return this.sceneController.saveSceneFragment(sceneFragment);
    }

    removeSceneFragment(context: Principal, sceneFragment: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.MODIFY);
        this.sceneController.removeSceneFragment(sceneFragment);
    }

    // Users

    getUsers(context: Principal) : Array<User> {
        return Array.from(this.accessController.model.users.values());
    }

    getUser(context: Principal, id: string): User {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getUser(id);
    }

    hasUser(context: Principal, id: string): boolean {
        return this.accessController.hasUser(id);
    }

    addUser(context: Principal, userId: string, userName: string): void {
        if (this.accessController.getGroup("administrators").userIds.size > 0) {
            // Omit admin check if no admins exist in admin group.
            this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        }

        this.accessController.addUser(userId, userName);
        info(context, userId + " added to users with name : '" + userName + "'");
        // Add user as viewer if viewers group exists.
        if (this.accessController.hasGroup("viewers")) {
            this.accessController.addGroupMember("viewers", userId);
            info(context, userId + " added to viewers group.");
        }

        // Add user as administrator if no administrators exist in administrator group.
        if (this.accessController.hasGroup("administrators")) {
            if (this.accessController.getGroup("administrators").userIds.size == 0) {
                this.accessController.addGroupMember("administrators", userId);
                info(context, userId + " added as first administrator to administrators group.");
            }
        }
    }

    updateUser(context: Principal, userId: string, userName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.updateUser(userId, userName);
    }

    removeUser(context: Principal, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUser(userId);
    }

    // Groups

    getGroups(context: Principal, name: string): Array<Group> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return Array.from(this.accessController.model.groups.values());
    }

    getGroup(context: Principal, name: string): Group {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getGroup(name);
    }

    hasGroup(context: Principal, name: string): boolean {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.hasGroup(name);
    }

    addGroup(context: Principal, groupName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroup(groupName);
    }

    removeGroup(context: Principal, groupName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroup(groupName);
    }

    // Group members

    addGroupMember(context: Principal, groupName: string, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroupMember(groupName, userId);
        info(context, userId + " added to viewers group.");
    }

    removeGroupMember(context: Principal, groupName: string, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupMember(groupName, userId);
    }

    // Privileges

    getPrivilegeLevel(context: Principal, type: PrivilegeType): number {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getPrivilegeLevel(type);
    }

    getResourceGroupPrivileges(context: Principal, sid: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getResourceGroupPrivileges(sid);
    }

    getResourceUserPrivileges(context: Principal, sid: string): Array<[string, string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getResourceUserPrivileges(sid);
    }

    getGroupPrivileges(context: Principal, groupName: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getGroupPrivileges(groupName);
    }

    getUserPrivileges(context: Principal, userId: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getUserPrivileges(userId);
    }

    hasPrivilege(context: Principal, userId: string, sid: string, type: PrivilegeType): boolean {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.hasPrivilege(userId, sid, type);
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

    removeSid(context: Principal, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeSid(sid);
    }

}