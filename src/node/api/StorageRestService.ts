import {Storage} from "../storage/Storage";
import {Repository} from "../storage/repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {match} from "../util/rest";
import {Context} from "../server/Context";
import {lift} from "../../common/util/functional";

export class StorageRestService {

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
                GET: async c => this.storage.getUsers(c.principal),
                POST: async c => this.storage.addUser(c.principal, c.body.id, c.body.name),
                PUT: undefined,
                DELETE: undefined
            }))
            .then(c => match(c, '/api/users/{id}', {
                GET: async c => this.storage.getUser(c.principal, c.pathParams.get('id')!!),
                POST: undefined,
                PUT: undefined,
                DELETE: undefined
             }))
            .then(c => resolve(c))
            .catch(error => reject(error))
        });
    }

}