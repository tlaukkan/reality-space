import {IncomingMessage, ServerResponse} from "http";
import {Principal} from "../../common/dataspace/Principal";

export class RestApiContext {
    context: Principal;
    request: IncomingMessage;
    response: ServerResponse;
    pathParams: Map<string, string>;
    processed: boolean;

    constructor(principal: Principal, request: IncomingMessage, response: ServerResponse, pathParams: Map<string, string>, processed: boolean) {
        this.context = principal;
        this.request = request;
        this.response = response;
        this.pathParams = pathParams;
        this.processed = processed;
    }
}