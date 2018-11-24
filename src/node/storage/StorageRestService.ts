import {Storage} from "./Storage";
import {Repository} from "./repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {match, respond} from "../util/rest";
import {Context} from "../../common/dataspace/Context";
import {lift} from "../util/functional";
import {RestApiContext} from "../../common/dataspace/RestApiContext";

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
            lift({pathParams: new Map(), ...c})
            .then(c => match(c, '/api/regions/:regionId/users', {GET: async c => this.getUsers(c), POST: undefined, PUT: undefined, DELETE: undefined}))
            .then(c => resolve(c))
            .catch(error => reject(error))
        });
    }

    private getUsers(context: RestApiContext) {
        if (context.request.method == "GET") {
            const regionId = context.pathParams.get("regionId");
            //console.log(regionId);
            respond(context, this.storage.getUsers(context.context));
        }
    }
}

/*
var url = require('url');
app.get('/status', function(req, res) {
  var parts = url.parse(req.url, true);
  var query = parts.query;
})
 */

/*
let body = [];
request.on('data', (chunk) => {
  body.push(chunk);
}).on('end', () => {
  body = Buffer.concat(body).toString();
  // at this point, `body` has the entire request body stored in it as a string
});
 */