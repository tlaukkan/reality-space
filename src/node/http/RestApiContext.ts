import {IncomingMessage, ServerResponse} from "http";
import {Principal} from "./Principal";

export class RestApiContext {
    principal: Principal;
    request: IncomingMessage;
    response: ServerResponse;
    pathParams: Map<string, string>;
    processed: boolean;
    body: any | undefined;

    constructor(principal: Principal, request: IncomingMessage, response: ServerResponse, processed: boolean, pathParams: Map<string, string>, body: any | undefined) {
        this.principal = principal;
        this.request = request;
        this.response = response;
        this.pathParams = pathParams;
        this.processed = processed;
        this.body = body;
    }
}