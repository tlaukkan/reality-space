import {User} from "./api/User";
import uuid = require("uuid");
import {Group} from "./api/Group";
import {GroupMember} from "./api/GroupMember";
import {GroupPrivilege} from "./api/GroupPrivilege";
import {UserPrivilege} from "./api/UserPrivilege";
import {PrivilegeType} from "./api/PrivilegeType";
import {DocumentController} from "../../node/storage/DocumentController";
import {Readable} from "stream";

export class StorageClient {

    storageUrl: string;
    cdnUrl: string;
    spaceName: string;
    region: string;
    idToken: string;

    constructor(spaceName: string, region: string, storageUrl: string, cdnUrl: string, idToken: string) {
        this.spaceName = spaceName;
        this.region = region;
        this.storageUrl = storageUrl;
        this.cdnUrl = cdnUrl;
        this.idToken = idToken;
    }

    async getRootEntitiesFromCdn(): Promise<string> {
        const entitiesXmlUrl = this.cdnUrl + "spaces/" + this.spaceName + "/regions/" + this.region + "/entities.xml";
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

    async getRootEntities(): Promise<string> {
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

    async listAssets(category: string): Promise<Array<string>> {
        return this.parseOptional(await this.request("GET", "/assets/" + category, [200]));
    };

    async saveAsset(category: string, fileName: string, readableStream: ReadableStream): Promise<void> {
        await this.requestWithBufferBody("POST", "/assets/" + category + "/" + fileName , readableStream, [200]);
    }

    async getAsset(category: string, fileName: string): Promise<ReadableStream | undefined> {
        const response = await this.request("GET", "/assets/" + category + "/" + fileName, [200, 404]);
        return await this.readBuffer(response);
    }

    async removeAsset(category: string, fileName: string): Promise<void> {
        await this.request("DELETE", "/assets/" + category + "/" + fileName, [200]);
    }

    async listUserFiles(category: string): Promise<Array<string>> {
        return this.parseOptional(await this.request("GET", "/user-files/" + category, [200]));
    };

    async saveUserFile(category: string, fileName: string, readableStream: ReadableStream): Promise<void> {
        await this.requestWithBufferBody("POST", "/user-files/" + category + "/" + fileName , readableStream, [200]);
    }

    async getUserFile(category: string, fileName: string): Promise<ReadableStream | undefined> {
        const response = await this.request("GET", "/user-files/" + category + "/" + fileName, [200, 404]);
        return await this.readBuffer(response);
    }

    async removeUserFile(category: string, fileName: string): Promise<void> {
        await this.request("DELETE", "/user-files/" + category + "/" + fileName, [200]);
    }

    private async request(method: string, path: string, successStatuses: Array<number>) {
        const response = (await fetch(this.storageUrl + "spaces/" + this.spaceName + "/regions/" + this.region + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()}
        }));
        if (successStatuses.indexOf(response.status) == -1) {
            throw new Error(response.status.toString());
        }
        return response;
    }

    private async requestWithBody(method: string, path: string, body: any, successStatuses: Array<number>) {
        const response = (await fetch(this.storageUrl + "spaces/" + this.spaceName + "/regions/" + this.region + path, {
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
        const response = (await fetch(this.storageUrl + "spaces/" + this.spaceName + "/regions/" + this.region + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()},
            body: body
        }));
        if (successStatuses.indexOf(response.status) == -1) {
            throw new Error(response.status.toString());
        }
        return response;
    }

    private async requestWithBufferBody(method: string, path: string, readableStream: ReadableStream, successStatuses: Array<number>) {
        //const blob = new Blob([body], {type : 'application/text'});
        const response = (await fetch(this.storageUrl + "spaces/" + this.spaceName + "/regions/" + this.region + path, {
            method: method,
            headers: {"Authorization": "Bearer " + this.idToken, "Request-ID": uuid.v4()},
            body: readableStream
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

    private async readBuffer(response: Response): Promise<ReadableStream | undefined> {
        if (response.status == 404) {
            return undefined;
        } else {
            return await response.body!!;
        }
    }

    private async getText(response: Response): Promise<any> {
        return await response.text();
    }
}