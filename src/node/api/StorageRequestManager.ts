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

export class StorageRequestManager {

    repository: Repository;
    sanitizer: Sanitizer;
    dimensionNameRegexs: Array<RegExp> = new Array<RegExp>();
    maxDimenions: number;
    storages: Map<string, Map<string, Storage>> = new Map();

    constructor(repository: Repository, sanitizer: Sanitizer, processorNames: Array<string>, dimensionNames: Array<string>, maxDimensions: number) {
        this.repository = repository;
        this.sanitizer = sanitizer;
        this.maxDimenions = maxDimensions;
        processorNames.forEach((processorName: string) => {
            dimensionNames.forEach((dimensionName: string) => {
                if (dimensionName.indexOf("*") > -1) {
                    this.dimensionNameRegexs.push(RegExp('^' + dimensionName.replace("*", ".*") + '$'));
                    return; // Do not instantiate wildcard dimensions
                }
                this.createStorage(dimensionName, processorName);
                console.log("reality server - processor storage added: " + dimensionName + "/" + processorName);
            });
        });
    }


    async startup() {
        for(let dimensionStorages of this.storages.values()) {
            for (const storage of dimensionStorages.values()) {
                await storage.startup();
            }
        }
    }

    async shutdown() {
        for(let dimensionStorages of this.storages.values()) {
            for (const storage of dimensionStorages.values()) {
                await storage.shutdown();
            }
        }
    }

    process(c: Context): Promise<Context> {
        return new Promise<Context>((resolve, reject) => {
            lift({pathParams: new Map(), body: undefined, ...c})
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/entities.xml', BodyEncoding.XML, {
                    GET: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getDocument(c.principal),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: undefined,
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/entities', BodyEncoding.XML, {
                    GET: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getDocument(c.principal),
                    POST: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).saveRootElements(c.principal, c.body),
                    PUT: undefined,
                    DELETE: undefined,
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/entities/{id}', BodyEncoding.XML, {
                    GET: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getElement(c.principal, c.pathParams.get('id')!!),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).removeElement(c.principal, c.pathParams.get('id')!!)
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/entities/{id}/entities', BodyEncoding.XML, {
                    GET: undefined,
                    POST: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).saveChildElements(c.principal, c.pathParams.get('id')!!, c.body),
                    PUT: undefined,
                    DELETE: undefined
                }))

                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/users', BodyEncoding.JSON, {
                    GET: async c => (await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getUsers(c.principal)).map(u => cu(u)),
                    POST: async c => cu(await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).addUser(c.principal, c.body.id.toString(), c.body.name.toString())),
                    PUT: undefined,
                    DELETE: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).removeElement(c.principal, c.body),
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/users/{id}', BodyEncoding.JSON, {
                    GET: async c => cu(await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getUser(c.principal, c.pathParams.get('id')!!)),
                    POST: undefined,
                    PUT: async c => cu(await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).updateUser(c.principal, c.pathParams.get('id')!!, c.body.name)),
                    DELETE: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).removeUser(c.principal, c.pathParams.get('id')!!)
                 }))

                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/groups', BodyEncoding.JSON, {
                    GET: async c => (await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getGroups(c.principal)).map(g => cg(g)),
                    POST: async c => cg(await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).addGroup(c.principal, c.body.name.toString())),
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/groups/{name}', BodyEncoding.JSON, {
                    GET: async c => cg(await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getGroup(c.principal, c.pathParams.get('name')!!)),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).removeGroup(c.principal, c.pathParams.get('name')!!)
                }))

                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/groups/{name}/members', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: async c => { await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).addGroupMember(c.principal, c.pathParams.get('name')!!, c.body.userId.toString()); return new GroupMember(c.pathParams.get('name')!!, c.body.userId.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/groups/{name}/members/{userId}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).removeGroupMember(c.principal, c.pathParams.get('name')!!, c.pathParams.get('userId')!!)
                }))

                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/groups/{name}/privileges', BodyEncoding.JSON, {
                    GET: async c => (await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getGroupPrivileges(c.principal, c.pathParams.get('name')!!)).map(value => new GroupPrivilege(value[1], c.pathParams.get('name')!!, value[0])),
                    POST: async c => { await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).setGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.body.type.toString(), c.body.sid.toString()); return new GroupPrivilege(c.body.type.toString(), c.pathParams.get('name')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/groups/{name}/privileges/{sid}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).removeGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/users/{userId}/privileges', BodyEncoding.JSON, {
                    GET: async c => (await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).getUserPrivileges(c.principal, c.pathParams.get('userId')!!)).map(value => new UserPrivilege(value[1], c.pathParams.get('userId')!!, value[0])),
                    POST: async c => { await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).setUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.body.type.toString(), c.body.sid.toString()); return new UserPrivilege(c.body.type.toString(), c.pathParams.get('userId')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/dimensions/{dimension}/processors/{processor}/users/{userId}/privileges/{sid}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.storage(c.pathParams.get('dimension')!!, c.pathParams.get('processor')!!)).removeUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => resolve(c))
                .catch(error => reject(error))
        });
    }

    private async storage(dimensionName: string, processorName: string) : Promise<Storage> {
        if (!this.storages.has(dimensionName) || !this.storages.get(dimensionName)!!.has(processorName) ) {
            for (let regExp of this.dimensionNameRegexs) {
                if (regExp.test(dimensionName)) {
                    console.log("reality server - processor storage creating on demand: " + dimensionName + "/" + processorName);
                    const newStorage = this.createStorage(dimensionName, processorName);
                    console.log("reality server - processor storage starting on demand: " + dimensionName + "/" + processorName);
                    await newStorage.startup();
                    console.log("reality server - processor storage started on demand: " + dimensionName + "/" + processorName);
                    return newStorage;
                }
            };
            throw new Error("reality server - no such dimension or processor: " + dimensionName + "/" + processorName);
        }
        return this.storages.get(dimensionName)!!.get(processorName)!!;
    }

    private createStorage(dimensionName: string, processorName: string): Storage {
        if (!this.storages.has(dimensionName)) {
            if (this.storages.size >= this.maxDimenions) {
                throw new Error("Maximum number of dimensions exist. Can not add new: " + dimensionName);
            }
            this.storages.set(dimensionName, new Map());
        }
        const storage = new Storage("dimensions/" + dimensionName + "/processors/" + processorName + "/entities.xml", "dimensions/" + dimensionName + "/processors/" + processorName + "/access.json", this.repository, this.sanitizer);
        this.storages.get(dimensionName)!!.set(processorName, storage);
        return storage;
    }
}

function cg(group: Group | undefined) {
    return group ? {name: group.name, userIds: Array.from(group.userIds)} : undefined;
}

function cu(user: User | undefined) {
    return user ? {id: user.id, name: user.name, groupNames: Array.from(user.groupNames)} : undefined;
}