import {IncomingMessage, ServerResponse} from "http";
import {Storage} from "./Storage";
import {Repository} from "./repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {matchUrl} from "../util/rest";
import {Context} from "./Context";

export class StorageRestService {

    storage: Storage;

    constructor(repository: Repository, sanitizer: Sanitizer) {
        this.storage = new Storage("data/scene.xml", "data/access.json", repository, sanitizer);
    }

    async startup() {
        await this.storage.startup();
    }

    async process(context: Context, request: IncomingMessage, response: ServerResponse): Promise<boolean> {
        if (matchUrl(request.url!!, '/api/regions/:regionId/users', context, request, response,
            (context: Context, request: IncomingMessage, response: ServerResponse, pathParams: Map<string, string>) => {
                console.log(pathParams);
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end();
        })) {
            return true;
        };

        return false;
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