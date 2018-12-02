import {Storage} from "../storage/Storage";
import {Repository} from "../storage/repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {match} from "../framework/rest/rest";
import {Context} from "../framework/http/Context";
import {lift} from "../../common/util/functional";
import {User} from "../../common/dataspace/api/User";

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
                GET: async c => this.storage.getUsers(c.principal).map(u => new User(u.id, u.name, Array.from(u.groupNames))),
                POST: async c => this.storage.addUser(c.principal, c.body.id.toString(), c.body.name.toString()),
                PUT: undefined,
                DELETE: undefined
            }))
            .then(c => match(c, '/api/users/{id}', {
                GET: async c => this.storage.getUser(c.principal, c.pathParams.get('id')!!),
                POST: undefined,
                PUT: async c => this.storage.updateUser(c.principal, c.pathParams.get('id')!!, c.body.name),
                DELETE: async c => this.storage.removeUser(c.principal, c.pathParams.get('id')!!)
             }))
            .then(c => resolve(c))
            .catch(error => reject(error))
        });
    }

}
