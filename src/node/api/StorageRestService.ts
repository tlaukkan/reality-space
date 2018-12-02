import {Storage} from "../storage/Storage";
import {Repository} from "../storage/repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {match, respond} from "../util/rest";
import {Context} from "../server/Context";
import {lift} from "../../common/util/functional";
import {RestApiContext} from "../server/RestApiContext";
import {error} from "../util/log";

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
            .then(c => match(c, '/api/users', {GET: async c => this.getUsers(c), POST: async c => this.addUser(c), PUT: undefined, DELETE: undefined}))
            .then(c => match(c, '/api/users/{id}', {GET: async c => this.getUser(c, c.pathParams.get('id')!!), POST: undefined, PUT: undefined, DELETE: undefined}))
            .then(c => resolve(c))
            .catch(error => reject(error))
        });
    }

    private getUsers(context: RestApiContext) {
        console.log(context.pathParams);
            respond(context, this.storage.getUsers(context.context));
    }

    private getUser(context: RestApiContext, id: string) {
        respond(context, this.storage.getUser(context.context, id));
    }

    private addUser(context: RestApiContext) {
        const body = Array<Uint8Array>();
        context.request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            const requestBodyJson = Buffer.concat(body).toString();
            console.log(requestBodyJson);
            const requestBodyObj = JSON.parse(requestBodyJson);
            this.storage.addUser(context.context, requestBodyObj.id, requestBodyObj.name);
            context.response.write(requestBodyJson);
            context.response.writeHead(200, {'Content-Type': 'text/json'});
            context.response.end();
        }).on('error', (err) => {
            error(context.context, "500 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers), err);
            context.response.writeHead(500, {'Content-Type': 'text/plain'});
            context.response.end();
        });
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