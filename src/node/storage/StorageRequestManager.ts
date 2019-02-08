import {Storage} from "./Storage";
import {Repository} from "./Repository";
import {Sanitizer} from "../../common/reality/Sanitizer";
import {BodyEncoding, match} from "../http/rest";
import {Context} from "../http/Context";
import {lift} from "../../common/reality/util/functional";
import {Group} from "./model/Group";
import {User} from "./model/User";
import {GroupMember} from "../../common/reality/api/GroupMember";
import {GroupPrivilege} from "../../common/reality/api/GroupPrivilege";
import {UserPrivilege} from "../../common/reality/api/UserPrivilege";

export class StorageRequestManager {

    static readonly DYNAMIC_STRORAGE_INACTIVITY_CLEANUP_TIME_MILLIS = 15 * 60 * 1000;
    repository: Repository;
    sanitizer: Sanitizer;
    spaceNameRegexs: Array<RegExp> = new Array<RegExp>();
    maxDimenions: number;
    storages: Map<string, Map<string, Storage>> = new Map();

    constructor(repository: Repository, sanitizer: Sanitizer, regions: Array<string>, spaceNames: Array<string>, maxSpaces: number) {
        this.repository = repository;
        this.sanitizer = sanitizer;
        this.maxDimenions = maxSpaces;
        regions.forEach((region: string) => {
            spaceNames.forEach((spaceName: string) => {
                if (spaceName.indexOf("*") > -1) {
                    this.spaceNameRegexs.push(RegExp('^' + spaceName.replace("*", ".*") + '$'));
                    return; // Do not instantiate wildcard spaces
                }
                this.createStorage(spaceName, region, false);
                console.log("reality server - processor storage added: " + spaceName + "/" + region);
            });
        });
    }

    async startup() {
        await this.repository.startup();
        for(let spaceStorages of this.storages.values()) {
            for (const storage of spaceStorages.values()) {
                await storage.startup();
            }
        }
        console.log('reality server - started storage manager.')
    }

    async close() {
        for(let spaceStorages of this.storages.values()) {
            for (const storage of spaceStorages.values()) {
                await storage.close();
            }
        }
        console.log('reality server - closed storage manager.')
    }

    process(c: Context): Promise<Context> {
        return new Promise<Context>((resolve, reject) => {
            lift({pathParams: new Map(), body: undefined, ...c})
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/entities.xml', BodyEncoding.XML, {
                    GET: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getDocument(c.principal),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: undefined,
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/entities', BodyEncoding.XML, {
                    GET: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getDocument(c.principal),
                    POST: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).saveRootElements(c.principal, c.body),
                    PUT: undefined,
                    DELETE: undefined,
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/entities/{id}', BodyEncoding.XML, {
                    GET: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getElement(c.principal, c.pathParams.get('id')!!),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).removeElement(c.principal, c.pathParams.get('id')!!)
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/entities/{id}/entities', BodyEncoding.XML, {
                    GET: undefined,
                    POST: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).saveChildElements(c.principal, c.pathParams.get('id')!!, c.body),
                    PUT: undefined,
                    DELETE: undefined
                }))

                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/users', BodyEncoding.JSON, {
                    GET: async c => (await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getUsers(c.principal)).map(u => cu(u)),
                    POST: async c => cu(await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).addUser(c.principal, c.body.id.toString(), c.body.name.toString())),
                    PUT: undefined,
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).removeElement(c.principal, c.body),
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/users/{id}', BodyEncoding.JSON, {
                    GET: async c => cu(await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getUser(c.principal, c.pathParams.get('id')!!)),
                    POST: undefined,
                    PUT: async c => cu(await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).updateUser(c.principal, c.pathParams.get('id')!!, c.body.name)),
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).removeUser(c.principal, c.pathParams.get('id')!!)
                 }))

                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/groups', BodyEncoding.JSON, {
                    GET: async c => (await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getGroups(c.principal)).map(g => cg(g)),
                    POST: async c => cg(await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).addGroup(c.principal, c.body.name.toString())),
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/groups/{name}', BodyEncoding.JSON, {
                    GET: async c => cg(await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getGroup(c.principal, c.pathParams.get('name')!!)),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).removeGroup(c.principal, c.pathParams.get('name')!!)
                }))

                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/groups/{name}/members', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: async c => { await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).addGroupMember(c.principal, c.pathParams.get('name')!!, c.body.userId.toString()); return new GroupMember(c.pathParams.get('name')!!, c.body.userId.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/groups/{name}/members/{userId}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).removeGroupMember(c.principal, c.pathParams.get('name')!!, c.pathParams.get('userId')!!)
                }))

                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/groups/{name}/privileges', BodyEncoding.JSON, {
                    GET: async c => (await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getGroupPrivileges(c.principal, c.pathParams.get('name')!!)).map(value => new GroupPrivilege(value[1], c.pathParams.get('name')!!, value[0])),
                    POST: async c => { await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).setGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.body.type.toString(), c.body.sid.toString()); return new GroupPrivilege(c.body.type.toString(), c.pathParams.get('name')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/groups/{name}/privileges/{sid}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).removeGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/users/{userId}/privileges', BodyEncoding.JSON, {
                    GET: async c => (await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).getUserPrivileges(c.principal, c.pathParams.get('userId')!!)).map(value => new UserPrivilege(value[1], c.pathParams.get('userId')!!, value[0])),
                    POST: async c => { await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).setUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.body.type.toString(), c.body.sid.toString()); return new UserPrivilege(c.body.type.toString(), c.pathParams.get('userId')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/users/{userId}/privileges/{sid}', BodyEncoding.JSON, {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).removeUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/assets/{category}', BodyEncoding.JSON, {
                    GET: async c => (await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).listAssets(c.principal, c.pathParams.get('category')!! + "/")),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: undefined
                }))

                .then(c => match(c, '/api/spaces/{space}/regions/{processor}/assets/{category}/{assetName}', BodyEncoding.BUFFER, {
                    GET: async c => (await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).loadAsset(c.principal, c.pathParams.get('category')!! + "/" + c.pathParams.get('assetName')!!)),
                    POST: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).saveAsset(c.principal, c.pathParams.get('category')!! + "/" + c.pathParams.get('assetName')!!, c.body as Buffer),
                    PUT: undefined,
                    DELETE: async c => await (await this.getStorage(c.pathParams.get('space')!!, c.pathParams.get('processor')!!)).deleteAsset(c.principal, c.pathParams.get('category')!! + "/" + c.pathParams.get('assetName')!!)
                }))

                .then(c => resolve(c))
                .catch(error => reject(error))
        });
    }

    private async getStorage(spaceName: string, region: string) : Promise<Storage> {
        for (const spaceStorages of this.storages.values()) {
            for (const storage of spaceStorages.values()) {
                if (storage.dynamic && storage.lastAccessTimeMillis + StorageRequestManager.DYNAMIC_STRORAGE_INACTIVITY_CLEANUP_TIME_MILLIS < new Date().getTime()) {
                    console.log("reality server - closing inactive dynamic storage: " + storage.spaceName + "/" + storage.region);
                    await storage.close();
                    spaceStorages.delete(storage.region);
                    if (spaceStorages.size == 0) {
                        this.storages.delete(storage.spaceName);
                    }
                }
            }
        }

        if (!this.storages.has(spaceName) || !this.storages.get(spaceName)!!.has(region) ) {
            for (let regExp of this.spaceNameRegexs) {
                if (regExp.test(spaceName)) {
                    console.log("reality server - processor storage creating on demand: " + spaceName + "/" + region);
                    const newStorage = this.createStorage(spaceName, region, true);
                    console.log("reality server - processor storage starting on demand: " + spaceName + "/" + region);
                    await newStorage.startup();
                    console.log("reality server - processor storage started on demand: " + spaceName + "/" + region);
                    return newStorage;
                }
            };
            throw new Error("reality server - no such space or processor: " + spaceName + "/" + region);
        }
        const storage = this.storages.get(spaceName)!!.get(region)!!;
        storage.lastAccessTimeMillis = new Date().getTime();
        return storage;
    }

    private createStorage(spaceName: string, region: string, dynamic: boolean): Storage {
        if (!this.storages.has(spaceName)) {
            if (this.storages.size >= this.maxDimenions) {
                throw new Error("Maximum number of spaces exist. Can not add new: " + spaceName);
            }
            this.storages.set(spaceName, new Map());
        }
        const storage = new Storage(spaceName, region, this.repository, this.sanitizer, dynamic);
        this.storages.get(spaceName)!!.set(region, storage);
        return storage;
    }
}

function cg(group: Group | undefined) {
    return group ? {name: group.name, userIds: Array.from(group.userIds)} : undefined;
}

function cu(user: User | undefined) {
    return user ? {id: user.id, name: user.name, groupNames: Array.from(user.groupNames)} : undefined;
}