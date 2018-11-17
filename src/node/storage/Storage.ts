import {AccessController} from "./AccessController";
import {SceneController} from "./SceneController";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {Repository} from "./repository/Repository";
import {PrivilegeType} from "./PrivilegeType";
import {User} from "./User";
import {Group} from "./Group";
import {Context} from "./Context";

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

    addGroup(context: Context, groupName: string): void {
        this.accessController.checkPrivilege(context.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroup(groupName);
    }

    addGroupMember(context: Context, groupName: string, userId: string): void {
        this.accessController.addGroupMember(groupName, userId);
    }

    addUser(context: Context, userId: string, userName: string): void {
        this.accessController.addUser(userId, userName);
    }

    getGroup(context: Context, name: string): Group {
        return this.accessController.getGroup(name);
    }

    getGroupPrivileges(context: Context, groupName: string): Array<[string, PrivilegeType]> {
        return this.accessController.getGroupPrivileges(groupName);
    }

    getPrivilegeLevel(context: Context, type: PrivilegeType): number {
        return this.accessController.getPrivilegeLevel(type);
    }

    getResourceGroupPrivileges(context: Context, sid: string): Array<[string, PrivilegeType]> {
        return this.accessController.getResourceGroupPrivileges(sid);
    }

    getResourceUserPrivileges(context: Context, sid: string): Array<[string, string, PrivilegeType]> {
        return this.accessController.getResourceUserPrivileges(sid);
    }

    getUser(context: Context, id: string): User {
        return this.accessController.getUser(id);
    }

    getUserPrivileges(context: Context, userId: string): Array<[string, PrivilegeType]> {
        return this.accessController.getUserPrivileges(userId);
    }

    hasGroup(context: Context, name: string): boolean {
        return this.accessController.hasGroup(name);
    }

    hasPrivilege(context: Context, userId: string, sid: string, type: PrivilegeType): boolean {
        return this.accessController.hasPrivilege(userId, sid, type);
    }

    hasUser(context: Context, id: string): boolean {
        return this.accessController.hasUser(id);
    }

    removeGroup(context: Context, groupName: string): void {
        this.accessController.removeGroup(groupName);
    }

    removeGroupMember(context: Context, groupName: string, userId: string): void {
        this.accessController.removeGroupMember(groupName, userId);
    }

    removeGroupPrivilege(context: Context, groupName: string, sid: string): void {
        this.accessController.removeGroupPrivilege(groupName, sid);
    }

    removeSid(context: Context, sid: string): void {
        this.accessController.removeSid(sid);
    }

    removeUser(context: Context, userId: string): void {
        this.accessController.removeUser(userId);
    }

    removeUserPrivilege(context: Context, userId: string, sid: string): void {
        this.accessController.removeUserPrivilege(userId, sid);
    }

    setGroupPrivilege(context: Context, groupName: string, type: PrivilegeType, sid: string): void {
        this.accessController.setGroupPrivilege(groupName, type, sid);
    }

    setUserPrivilege(context: Context, userId: string, type: PrivilegeType, sid: string): void {
        this.accessController.setUserPrivilege(userId, type, sid);
    }

    updateUser(context: Context, userId: string, userName: string): void {
        this.accessController.updateUser(userId, userName);
    }

    getScene(context: Context): string {
        return this.sceneController.getScene();
    }

    saveSceneFragment(context: Context, sceneFragment: string): string {
        return this.sceneController.saveSceneFragment(sceneFragment);
    }

    removeSceneFragment(context: Context, sceneFragment: string): void {
        this.sceneController.removeSceneFragment(sceneFragment);
    }

}