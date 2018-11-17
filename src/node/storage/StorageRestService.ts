import {IncomingMessage, ServerResponse} from "http";
import {Storage} from "./Storage";
import {Repository} from "./repository/Repository";
import {Sanitizer} from "../../common/dataspace/Sanitizer";
import {IdTokenIssuer} from "../../common/dataspace/Configuration";

export class StorageRestService {

    storage: Storage;

    constructor(repository: Repository, sanitizer: Sanitizer, idTokenIssuers: Array<IdTokenIssuer>) {
        this.storage = new Storage("data/scene.xml", "data/access.json", repository, sanitizer);
    }

    async startup() {
        await this.storage.startup();
    }

    async process(request: IncomingMessage, response: ServerResponse) {
        console.log("\n" + request.method +": " + request.url + " " + JSON.stringify(request.headers));
        if (request.url!!.endsWith('/health-check')) {
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end();
        }
    }

}