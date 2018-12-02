import {Storage} from "../storage/Storage";
import {Repository} from "../storage/repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {match} from "../framework/rest/rest";
import {Context} from "../framework/http/Context";
import {lift} from "../../common/util/functional";
import {Group} from "../storage/model/Group";
import {User} from "../storage/model/User";
import {GroupMember} from "../../common/dataspace/api/GroupMember";
import {GroupPrivilege} from "../../common/dataspace/api/GroupPrivilege";
import {UserPrivilege} from "../../common/dataspace/api/UserPrivilege";

export class StorageApi {

    storage: Storage;

    constructor(repository: Repository, sanitizer: Sanitizer) {
        this.storage = new Storage("data/scene.xml", "data/access.json", repository, sanitizer);
    }

    async startup() {
        await this.storage.startup();
    }

    process(c: Context): Promise<Context> {
        return new Promise<Context>((resolve, reject) => {
            lift({pathParams: new Map(), body: undefined, ...c})

                .then(c => match(c, '/api/users', {
                    GET: async c => this.storage.getUsers(c.principal).map(u => cu(u)),
                    POST: async c => cu(this.storage.addUser(c.principal, c.body.id.toString(), c.body.name.toString())),
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/users/{id}', {
                    GET: async c => cu(this.storage.getUser(c.principal, c.pathParams.get('id')!!)),
                    POST: undefined,
                    PUT: async c => cu(this.storage.updateUser(c.principal, c.pathParams.get('id')!!, c.body.name)),
                    DELETE: async c => this.storage.removeUser(c.principal, c.pathParams.get('id')!!)
                 }))

                .then(c => match(c, '/api/groups', {
                    GET: async c => this.storage.getGroups(c.principal).map(g => cg(g)),
                    POST: async c => cg(this.storage.addGroup(c.principal, c.body.name.toString())),
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/groups/{name}', {
                    GET: async c => cg(this.storage.getGroup(c.principal, c.pathParams.get('name')!!)),
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => this.storage.removeGroup(c.principal, c.pathParams.get('name')!!)
                }))

                .then(c => match(c, '/api/groups/{name}/members', {
                    GET: undefined,
                    POST: async c => { this.storage.addGroupMember(c.principal, c.pathParams.get('name')!!, c.body.userId.toString()); return new GroupMember(c.pathParams.get('name')!!, c.body.userId.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/groups/{name}/members/{userId}', {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => this.storage.removeGroupMember(c.principal, c.pathParams.get('name')!!, c.pathParams.get('userId')!!)
                }))

                .then(c => match(c, '/api/groups/{name}/privileges', {
                    GET: async c => this.storage.getGroupPrivileges(c.principal, c.pathParams.get('name')!!).map(value => new GroupPrivilege(value[1], c.pathParams.get('name')!!, value[0])),
                    POST: async c => { this.storage.setGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.body.type.toString(), c.body.sid.toString()); return new GroupPrivilege(c.body.type.toString(), c.pathParams.get('name')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/groups/{name}/privileges/{sid}', {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => this.storage.removeGroupPrivilege(c.principal, c.pathParams.get('name')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => match(c, '/api/users/{userId}/privileges', {
                    GET: async c => this.storage.getUserPrivileges(c.principal, c.pathParams.get('userId')!!).map(value => new UserPrivilege(value[1], c.pathParams.get('userId')!!, value[0])),
                    POST: async c => { this.storage.setUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.body.type.toString(), c.body.sid.toString()); return new UserPrivilege(c.body.type.toString(), c.pathParams.get('userId')!!, c.body.sid.toString()); },
                    PUT: undefined,
                    DELETE: undefined
                }))
                .then(c => match(c, '/api/users/{userId}/privileges/{sid}', {
                    GET: undefined,
                    POST: undefined,
                    PUT: undefined,
                    DELETE: async c => this.storage.removeUserPrivilege(c.principal, c.pathParams.get('userId')!!, c.pathParams.get('sid')!!)
                }))

                .then(c => resolve(c))
                .catch(error => reject(error))
        });
    }


}

function cg(group: Group | undefined) {
    return group ? {name: group.name, userIds: Array.from(group.userIds)} : undefined;
}

function cu(user: User | undefined) {
    return user ? {id: user.id, name: user.name, groupNames: Array.from(user.groupNames)} : undefined;
}