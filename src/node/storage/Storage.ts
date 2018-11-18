import {AccessController} from "./AccessController";
import {SceneController} from "./SceneController";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {Repository} from "./repository/Repository";
import {PrivilegeType} from "./PrivilegeType";
import {User} from "./User";
import {Group} from "./Group";
import {Context} from "../../common/dataspace/Context";

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

    getUsers(context: Context) : Array<User> {
        return Array.from(this.accessController.model.users.values());
    }

    addGroup(context: Context, groupName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroup(groupName);
    }

    addGroupMember(context: Context, groupName: string, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroupMember(groupName, userId);
    }

    addUser(context: Context, userId: string, userName: string): void {
        if (this.accessController.getGroup("administrators").userIds.size > 0) {
            // Omit admin check if no admins exist in admin group.
            this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        }

        this.accessController.addUser(userId, userName);

        // Add user as administrator if no administrators exist in administrator group.
        if (this.accessController.hasGroup("administrators")) {
            if (this.accessController.getGroup("administrators").userIds.size == 0) {
                this.accessController.addGroupMember("administrators", userId);
            }
        }
    }

    getGroup(context: Context, name: string): Group {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getGroup(name);
    }

    getGroupPrivileges(context: Context, groupName: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getGroupPrivileges(groupName);
    }

    getPrivilegeLevel(context: Context, type: PrivilegeType): number {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getPrivilegeLevel(type);
    }

    getResourceGroupPrivileges(context: Context, sid: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getResourceGroupPrivileges(sid);
    }

    getResourceUserPrivileges(context: Context, sid: string): Array<[string, string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getResourceUserPrivileges(sid);
    }

    getUser(context: Context, id: string): User {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getUser(id);
    }

    getUserPrivileges(context: Context, userId: string): Array<[string, PrivilegeType]> {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getUserPrivileges(userId);
    }

    hasGroup(context: Context, name: string): boolean {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.hasGroup(name);
    }

    hasPrivilege(context: Context, userId: string, sid: string, type: PrivilegeType): boolean {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        return this.accessController.hasPrivilege(userId, sid, type);
    }

    hasUser(context: Context, id: string): boolean {
        return this.accessController.hasUser(id);
    }

    removeGroup(context: Context, groupName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroup(groupName);
    }

    removeGroupMember(context: Context, groupName: string, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupMember(groupName, userId);
    }

    removeGroupPrivilege(context: Context, groupName: string, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupPrivilege(groupName, sid);
    }

    removeSid(context: Context, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeSid(sid);
    }

    removeUser(context: Context, userId: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUser(userId);
    }

    removeUserPrivilege(context: Context, userId: string, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUserPrivilege(userId, sid);
    }

    setGroupPrivilege(context: Context, groupName: string, type: PrivilegeType, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.setGroupPrivilege(groupName, type, sid);
    }

    setUserPrivilege(context: Context, userId: string, type: PrivilegeType, sid: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.setUserPrivilege(userId, type, sid);
    }

    updateUser(context: Context, userId: string, userName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.updateUser(userId, userName);
    }

    getScene(context: Context): string {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.VIEW);
        return this.sceneController.getScene();
    }

    saveSceneFragment(context: Context, sceneFragment: string): string {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.MODIFY);
        return this.sceneController.saveSceneFragment(sceneFragment);
    }

    removeSceneFragment(context: Context, sceneFragment: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.MODIFY);
        this.sceneController.removeSceneFragment(sceneFragment);
    }

}