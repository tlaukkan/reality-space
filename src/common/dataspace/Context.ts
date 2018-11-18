import {IncomingMessage, ServerResponse} from "http";
import {Principal} from "./Principal";

export class Context {
    context: Principal;
    request: IncomingMessage;
    response: ServerResponse;
    processed: boolean;

    constructor(principal: Principal, request: IncomingMessage, response: ServerResponse, processed: boolean) {
        this.context = principal;
        this.request = request;
        this.response = response;
        this.processed = processed;
    }
}