import {User} from "./User";
import uuid = require("uuid");
import {Group} from "./Group";
import {GroupMember} from "./GroupMember";
import {GroupPrivilege} from "./GroupPrivilege";
import {UserPrivilege} from "./UserPrivilege";
import {PrivilegeType} from "./PrivilegeType";
import {DocumentController} from "../../../node/storage/DocumentController";

export class StorageClient {

    apiUrl: string;
    assetUrl: string;
    serverName: string;
    idToken: string;

    constructor(serverName: string, apiUrl: string, assetUrl: string, idToken: string) {
        this.serverName = serverName;
        this.apiUrl = apiUrl;
        this.assetUrl = assetUrl;
        this.idToken = idToken;
    }

    async getRootEntitiesFromCdn(): Promise<string> {
        const entitiesXmlUrl = this.assetUrl + "/servers/" + this.serverName + "/entities.xml";
        const response = (await fetch(entitiesXmlUrl, {
            method: "GET",
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()}
        }));
        if (response.status != 200) {
            console.log("Error loading stored entities from assets " + entitiesXmlUrl + " : " + response.status.toString());
            return DocumentController.EMPTY_FRAGMENT;
        }
        return await response.text();
    }

    async getRootEntities(): Promise<String> {
        return this.getText(await this.request("GET", "/entities", [200]));
    };

    async getEntity(sid: string): Promise<string> {
        return this.getText(await this.request("GET", "/entities/" + sid, [200, 404]));
    }

    async saveRootEntities(fragmentXml: string): Promise<string> {
        return this.getText(await this.requestWithTextBody("POST", "/entities", fragmentXml, [200]));
    }

    async saveChildEntities(parentSid: string, fragmentXml: string): Promise<string> {
        return this.getText(await this.requestWithTextBody("POST", "/entities/" + parentSid + "/entities", fragmentXml, [200]));
    }

    async removeEntity(sid: string): Promise<void> {
        await this.request("DELETE", "/entities/" + sid, [200]);
    }



    async getUsers(): Promise<Array<User>> {
        return this.parse(await this.request("GET", "/users", [200]));
    };

    async getUser(id: string): Promise<User | undefined> {
        return this.parseOptional(await this.request("GET", "/users/" + id, [200, 404]));
    }

    async addUser(user: User): Promise<User> {
        return this.parse(await this.requestWithBody("POST", "/users", user, [200]));
    }

    async updateUser(user: User): Promise<User> {
        return this.parse(await this.requestWithBody("PUT", "/users/" + user.id, user, [200]));
    }

    async removeUser(id: string): Promise<void> {
        await this.request("DELETE", "/users/" + id, [200]);
    }



    async getGroups(): Promise<Array<Group>> {
        return this.parse(await this.request("GET", "/groups", [200]));
    };

    async getGroup(name: string): Promise<Group | undefined> {
        return this.parseOptional(await this.request("GET", "/groups/" + name, [200, 404]));
    }

    async addGroup(group: Group): Promise<Group> {
        return this.parse(await this.requestWithBody("POST", "/groups", group, [200]));
    }

    async removeGroup(name: string): Promise<void> {
        await this.request("DELETE", "/groups/" + name, [200]);
    }



    async addGroupMember(groupName: string, userId: string): Promise<GroupMember> {
        return this.parse(await this.requestWithBody("POST", "/groups/" + groupName + "/members", new GroupMember(groupName, userId), [200]));
    }

    async removeGroupMember(groupName: string, userId: string): Promise<void> {
        await this.request("DELETE", "/groups/" + groupName + "/members/" + userId, [200]);
    }



    async getUserPrivileges(userId: string): Promise<Array<UserPrivilege>> {
        return this.parse(await this.request("GET", "/users/" + userId + "/privileges", [200]));
    }

    async getGroupPrivileges(name: string): Promise<Array<GroupPrivilege>> {
        return this.parse(await this.request("GET", "/groups/" + name + "/privileges", [200]));
    }


    async setUserPrivilege(userId: string, sid: string, type: PrivilegeType): Promise<UserPrivilege> {
        return this.parse(await this.requestWithBody("POST", "/users/" + userId + "/privileges", new UserPrivilege(type, userId, sid), [200]));
    }

    async setGroupPrivilege(groupName: string, sid: string, type: PrivilegeType): Promise<GroupPrivilege> {
        return this.parse(await this.requestWithBody("POST", "/groups/" + groupName + "/privileges", new GroupPrivilege(type, groupName, sid), [200]));
    }


    async removeUserPrivilege(userId: string, sid: string): Promise<void> {
        await this.request("DELETE", "/users/" + userId + "/privileges/" + sid, [200]);
    }

    async removeGroupPrivilege(groupName: string, sid: string): Promise<void> {
        await this.request("DELETE", "/groups/" + groupName + "/privileges/" + sid, [200]);
    }


    private async request(method: string, path: string, successStatuses: Array<number>) {
        const response = (await fetch(this.apiUrl + "/servers/" + this.serverName + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()}
        }));
        if (successStatuses.indexOf(response.status) == -1) {
            throw new Error(response.status.toString());
        }
        return response;
    }

    private async requestWithBody(method: string, path: string, body: any, successStatuses: Array<number>) {
        const response = (await fetch(this.apiUrl + "/servers/" + this.serverName + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()},
            body: JSON.stringify(body)
        }));
        if (successStatuses.indexOf(response.status) == -1) {
            throw new Error(response.status.toString());
        }
        return response;
    }

    private async requestWithTextBody(method: string, path: string, body: string, successStatuses: Array<number>) {
        const response = (await fetch(this.apiUrl + "/servers/" + this.serverName + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()},
            body: body
        }));
        if (successStatuses.indexOf(response.status) == -1) {
            throw new Error(response.status.toString());
        }
        return response;
    }

    private async parse(response: Response): Promise<any> {
        return await response.json();
    }

    private async parseOptional(response: Response): Promise<any | undefined> {
        if (response.status == 404) {
            return undefined;
        } else {
            return await response.json();
        }
    }

    private async getText(response: Response): Promise<any> {
        return await response.text();
    }
}