import {Storage} from "../storage/Storage";
import {Repository} from "../storage/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {BodyEncoding, match} from "../framework/rest/rest";
import {Context} from "../framework/http/Context";
import {lift} from "../../common/util/functional";
import {Group} from "../storage/model/Group";
import {User} from "../storage/model/User";
import {GroupMember} from "../../common/dataspace/api/GroupMember";
import {GroupPrivilege} from "../../common/dataspace/api/GroupPrivilege";
import {UserPrivilege} from "../../common/dataspace/api/UserPrivilege";

export class StorageApi {

    storages: Map<string, Storage> = new Map();

    constructor(repository: Repository, sanitizer: Sanitizer, serverNames: Array<string>) {
        serverNames.forEach(serverName => {
            this.storages.set(serverName, new Storage(serverName + "/entities.xml", serverName + "/access.json", repository, sanitizer));
            console.log("dataspace server - server storage added: " + serverName);
        });
    }

    async startup() {
        for(let storage of this.storages.values()) {
            await storage.startup();
        }
    }

    async shutdown() {
        for(let storage of this.storages.values()) {
            await storage.shutdown();
        }
    }

    process(c: Context): Promise<Context> {
        return new Promise<Context>((resolve, reject) => {
            lift({pathParams: new Map(), body: undefined, ...c})
                .then(c => match(c, '/api/servers/{server}/entities', BodyEncoding.XML, {
                    GET: async c => await this.storage(c.pathParams.get('server')!!).getDocument(c.principal),
                    POST: async c => await this.storage(c.pathParams.get('server')!!).saveRootElements(c.principal, c.body),
                    PUT: undefined,
                    DELETE: undefined,
                }))
                .then(c => match(c, '/api/servers/{server}/entities/{id}', BodyEncoding.XML, {
                    GET: async c => await this.storage(c.pathParams.get('server')!!).getElement(c.principal, c.pathParams.get('id')!!),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await this.storage(c.pathParams.get('server')!!).removeElement(c.principal, c.pathParams.get('id')!!)
                }))
                .then(c => match(c, '/api/servers/{server}/entities/{id}/entities', BodyEncoding.XML, {
                    GET: undefined,
                    POST: async c => await this.storage(c.pathParams.get('server')!!).saveChildElements(c.principal, c.pathParams.get('id')!!, c.body),
                    PUT: undefined,
                    DELETE: undefined
                }))

                .then(c => match(c, '/api/servers/{server}/users', BodyEncoding.JSON, {
                    GET: async c => (await this.storage(c.pathParams.get('server')!!).getUsers(c.principal)).map(u => cu(u)),
                    POST: async c => cu(await this.storage(c.pathParams.get('server')!!).addUser(c.principal, c.body.id.toString(), c.body.name.toString())),
                    PUT: undefined,
                    DELETE: async c => await this.storage(c.pathParams.get('server')!!).removeElement(c.principal, c.body),
                }))
                .then(c => match(c, '/api/servers/{server}/users/{id}', BodyEncoding.JSON, {
                    GET: async c => cu(await this.storage(c.pathParams.get('server')!!).getUser(c.principal, c.pathParams.get('id')!!)),
                    POST: undefined,
                    PUT: async c => cu(await this.storage(c.pathParams.get('server')!!).updateUser(c.principal, c.pathParams.get('id')!!, c.body.name)),
                    DELETE: async c => await this.storage(c.pathParams.get('server')!!).removeUser(c.principal, c.pathParams.get('id')!!)
                 }))

                .then(c => match(c, '/api/servers/{server}/groups', BodyEncoding.JSON, {
                    GET: async c => (await this.storage(c.pathParams.get('server')!!).getGroups(c.principal)).map(g => cg(g)),
                    POST: async c => cg(await this.storage(c.pathParams.get('server')!!).addGroup(c.principal, c.body.name.toString())),
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/servers/{server}/groups/{name}', BodyEncoding.JSON, {
                    GET: async c => cg(await this.storage(c.pathParams.get('server')!!).getGroup(c.principal, c.pathParams.get('name')!!)),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await this.storage(c.pathParams.get('server')!!).removeGroup(c.principal, c.pathParams.get('name')!!)
                }))

                .then(c => match(c, '/api/servers/{server}/groups/{name}/members', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: async c => { await this.storage(c.pathParams.get('server')!!).addGroupMember(c.principal, c.pathParams.get('name')!!, c.body.userId.toString()); return new GroupMember(c.pathParams.get('name')!!, c.body.userId.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/servers/{server}/groups/{name}/members/{userId}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await this.storage(c.pathParams.get('server')!!).removeGroupMember(c.principal, c.pathParams.get('name')!!, c.pathParams.get('userId')!!)
                }))

                .then(c => match(c, '/api/servers/{server}/groups/{name}/privileges', BodyEncoding.JSON, {
                    GET: async c => (await this.storage(c.pathParams.get('server')!!).getGroupPrivileges(c.principal, c.pathParams.get('name')!!)).map(value => new GroupPrivilege(value[1], c.pathParams.get('name')!!, value[0])),
                    POST: async c => { await this.storage(c.pathParams.get('server')!!).setGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.body.type.toString(), c.body.sid.toString()); return new GroupPrivilege(c.body.type.toString(), c.pathParams.get('name')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/servers/{server}/groups/{name}/privileges/{sid}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await this.storage(c.pathParams.get('server')!!).removeGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => match(c, '/api/servers/{server}/users/{userId}/privileges', BodyEncoding.JSON, {
                    GET: async c => (await this.storage(c.pathParams.get('server')!!).getUserPrivileges(c.principal, c.pathParams.get('userId')!!)).map(value => new UserPrivilege(value[1], c.pathParams.get('userId')!!, value[0])),
                    POST: async c => { await this.storage(c.pathParams.get('server')!!).setUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.body.type.toString(), c.body.sid.toString()); return new UserPrivilege(c.body.type.toString(), c.pathParams.get('userId')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/servers/{server}/users/{userId}/privileges/{sid}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await this.storage(c.pathParams.get('server')!!).removeUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => resolve(c))
                .catch(error => reject(error))
        });
    }

    storage(serverName: string) : Storage {
        if (!this.storages.has(serverName)) {
            throw new Error("No such server: " + serverName);
        }
        return this.storages.get(serverName)!!;
    }

}

function cg(group: Group | undefined) {
    return group ? {name: group.name, userIds: Array.from(group.userIds)} : undefined;
}

function cu(user: User | undefined) {
    return user ? {id: user.id, name: user.name, groupNames: Array.from(user.groupNames)} : undefined;
}