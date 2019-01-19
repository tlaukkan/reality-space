import {AccessController} from "./AccessController";
import {DocumentController} from "./DocumentController";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {Repository} from "./Repository";
import {PrivilegeType} from "./model/PrivilegeType";
import {User} from "./model/User";
import {Group} from "./model/Group";
import {Principal} from "../framework/rest/Principal";
import {info} from "../util/log";

export class Storage {

    private readonly documentFileName: string;
    private readonly accessFileName: string;

    accessController: AccessController;
    documentController: DocumentController;
    repository: Repository;

    constructor(sceneFileName: string, accessFileName: string, repository: Repository, sanitizer: Sanitizer) {
        this.documentFileName = sceneFileName;
        this.accessFileName = accessFileName;
        this.repository = repository;
        this.accessController = new AccessController();
        this.documentController = new DocumentController(sanitizer);
    }

    async startup() {
        await this.load();
    }

    clear() {
        this.documentController.clear();
        this.accessController.clear();
    }

    init() {
        this.accessController.init();
    }

    async load() {
        const sceneContent = await this.repository.load(this.documentFileName);
        //console.log("LOADING entities.xml: " + this.sceneFileName + " " + sceneContent);
        if (sceneContent.length > 0) {
            this.documentController.deserialize(sceneContent);
            console.log("reality server - storage document controller state loaded from repository.");
        } else {
            await this.repository.save(this.documentFileName, this.documentController.serialize());
            console.log("reality server - storage document controller started for the first time.");
        }
        const accessContent = await this.repository.load(this.accessFileName);
        if (accessContent.length > 0) {
            console.log('reality server - storage access controller state loaded from repository.');
            this.accessController.deserialize(accessContent);
        } else {
            console.log('reality server - storage access controller started for the first time.');
            this.accessController.init();
            await this.save();
        }
    }

    async shutdown() {
        await this.save();
    }

    async save() {
        await this.saveAccess();
        await this.saveDocument();
    }

    async saveDocument() {
        await this.repository.save(this.documentFileName, await this.documentController.serialize());
    }

    async saveAccess() {
        await this.repository.save(this.accessFileName, await this.accessController.serialize());
    }

    private async provisionUser(principal: Principal) {
        if (principal.groups === undefined) {
            return;
        }

        let changes = false;

        if (!this.accessController.hasUser(principal.userId)) {
            this.accessController.addUser(principal.userId, principal.userName);
            info(principal, "user provisioning added " + principal.userId + " : '" + principal.userName + "'");
            changes = true;
        }

        const existingUser = this.accessController.getUser(principal.userId);
        if (existingUser.name != principal.userName) {
            this.accessController.updateUser(principal.userId, principal.userName);
            info(principal, "user provisioning updated username " + principal.userId + " : '" + principal.userName + "'");
            changes = true;
        }

        for (let groupName of principal.groups) {
            if (!existingUser.groupNames.has(groupName)) {
                if (this.accessController.model.groups.has(groupName)) {
                    this.accessController.addGroupMember(groupName, principal.userId);
                    info(principal, "user provisioning added user to group " + principal.userId + " : '" + groupName + "'");
                    changes = true;
                }
            }
        }

        for (let existingGroupName of existingUser.groupNames) {
            if (principal.groups.indexOf(existingGroupName) == -1) {
                this.accessController.removeGroupMember(existingGroupName, principal.userId);
                info(principal, "user provisioning removed user from group " + principal.userId + " : '" + existingGroupName + "'");
                changes = true;
            }
        }

        if (changes) {
            await this.saveAccess();
        }
    }

    // Document

    async getDocument(principal: Principal): Promise<string> {
        this.provisionUser(principal);
        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.VIEW);
        return this.documentController.getDocument();
    }

    async getElement(principal: Principal, sid: string): Promise<string | undefined> {
        this.provisionUser(principal);
        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.VIEW);
        if (this.documentController.hasElement(sid)) {
            return this.documentController.getElement(sid);
        } else {
            return undefined;
        }
    }

    async saveRootElements(principal: Principal, fragmentXml: string): Promise<string> {
        this.provisionUser(principal);
        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.MODIFY);
        const fragment = this.documentController.putRootElements(fragmentXml);
        info(principal, "saved root elements: " + fragment);
        await this.saveDocument();
        return fragment;
    }

    async saveChildElements(principal: Principal, parentSid: string, fragmentXml: string): Promise<string> {
        this.provisionUser(principal);
        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.MODIFY);
        const fragment = this.documentController.putChildElements(parentSid, fragmentXml);
        info(principal, "saved " + parentSid + " child elements: " + fragment);
        await this.saveDocument();
        return fragment;
    }

    async removeElement(principal: Principal, sid: string): Promise<void> {
        this.provisionUser(principal);
        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.MODIFY);
        this.documentController.remove(sid);
        info(principal, "removed element fragment: " + sid);
        await this.saveDocument();
    }

    // Users

    async getUsers(principal: Principal) : Promise<Array<User>> {
        this.provisionUser(principal);
        return Array.from(this.accessController.model.users.values());
    }

    async getUser(principal: Principal, id: string): Promise<User | undefined> {
        this.provisionUser(principal);
        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        if (this.accessController.hasUser(id)) {
            return this.accessController.getUser(id);
        } else {
            return undefined;
        }
    }

    async addUser(principal: Principal, id: string, userName: string): Promise<User> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);

        if (!this.accessController.hasUser(id)) {
            this.accessController.addUser(id, userName);
            info(principal, "user " + id + " added with name : '" + userName + "'");
            await this.saveAccess();
        } else {
            info(principal, "user " + id + " already added.");
        }

        return this.accessController.getUser(id);
    }

    async updateUser(principal: Principal, id: string, userName: string): Promise<User> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.updateUser(id, userName);
        info(principal, "user " + id + " updated with name : '" + userName + "'");
        await this.saveAccess();
        return this.accessController.getUser(id);
    }

    async removeUser(principal: Principal, userId: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUser(userId);
        info(principal, "user " + userId + " removed.");
        await this.saveAccess();
    }

    // Groups

    async getGroups(principal: Principal): Promise<Array<Group>> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        return Array.from(this.accessController.model.groups.values());
    }

    async getGroup(principal: Principal, name: string): Promise<Group | undefined> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        if (this.accessController.hasGroup(name)) {
            return this.accessController.getGroup(name);
        } else {
            return undefined;
        }
    }

    async addGroup(principal: Principal, groupName: string): Promise<Group> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroup(groupName);
        info(principal, "group '" + groupName + "' added.");
        await this.saveAccess();
        return this.accessController.getGroup(groupName);
    }

    async removeGroup(principal: Principal, groupName: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroup(groupName);
        info(principal, "group '" + groupName + "' removed.");
        await this.saveAccess();
    }

    // Group members

    async addGroupMember(principal: Principal, groupName: string, userId: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.addGroupMember(groupName, userId);
        info(principal, "user " + userId + " added to " + groupName + " group.");
        await this.saveAccess();
    }

    async removeGroupMember(principal: Principal, groupName: string, userId: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupMember(groupName, userId);
        info(principal, "user " + userId + " removed from " + groupName + " group.");
        await this.saveAccess();
    }

    // Privileges

    async getGroupPrivileges(principal: Principal, groupName: string): Promise<Array<[string, PrivilegeType]>> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getGroupPrivileges(groupName);
    }

    async getUserPrivileges(principal: Principal, userId: string): Promise<Array<[string, PrivilegeType]>> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        return this.accessController.getUserPrivileges(userId);
    }

    async setGroupPrivilege(principal: Principal, groupName: string, type: PrivilegeType, sid: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.setGroupPrivilege(groupName, type, sid);
        info(principal, "group '" + groupName + "' privilege for '" + sid + "' set to  : '" + type);
        await this.saveAccess();
    }

    async setUserPrivilege(principal: Principal, userId: string, type: PrivilegeType, sid: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.setUserPrivilege(userId, type, sid);
        info(principal, "user '" + userId + "' privilege for '" + sid + "' set to  : '" + type);
        await this.saveAccess();
    }

    async removeGroupPrivilege(principal: Principal, groupName: string, sid: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeGroupPrivilege(groupName, sid);
        info(principal, "group '" + groupName + "' privilege for '" + sid + "' removed.");
        await this.saveAccess();
    }

    async removeUserPrivilege(principal: Principal, userId: string, sid: string): Promise<void> {
        this.provisionUser(principal);

        this.accessController.checkPrivilege(principal.userId, "", PrivilegeType.ADMIN);
        this.accessController.removeUserPrivilege(userId, sid);
        info(principal, "user '" + userId + "' privilege for '" + sid + "' removed.");
        await this.saveAccess();
    }

}