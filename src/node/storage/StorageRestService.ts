import {Storage} from "./Storage";
import {Repository} from "./repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {matchUrl} from "../util/rest";
import {RequestContext} from "../../common/dataspace/RequestContext";

export class StorageRestService {

    storage: Storage;

    constructor(repository: Repository, sanitizer: Sanitizer) {
        this.storage = new Storage("data/scene.xml", "data/access.json", repository, sanitizer);
    }

    async startup() {
        await this.storage.startup();
    }

    process(requestContext: RequestContext): Promise<RequestContext> {
        return new Promise<RequestContext>((resolve, reject) => {
            matchUrl(requestContext, '/api/regions/:regionId/users',
                async (requestContext: RequestContext, pathParams: Map<string, string>) => {
                    const regionId = pathParams.get("regionId");
                    console.log(regionId);
                    requestContext.response.write(JSON.stringify(this.storage.getUsers(requestContext.context)));
                    requestContext.response.writeHead(200, {'Content-Type': 'text/json'});
                    requestContext.response.end();
            }).then(requestContext => {
               resolve(requestContext);
            }).catch(error => {
                reject(error);
            })
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