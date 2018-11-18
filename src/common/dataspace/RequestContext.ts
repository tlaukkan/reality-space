import {IncomingMessage, ServerResponse} from "http";
import {Context} from "./Context";

export class RequestContext {
    context: Context;
    request: IncomingMessage;
    response: ServerResponse;
    processed: boolean;

    constructor(context: Context, request: IncomingMessage, response: ServerResponse, processed: boolean) {
        this.context = context;
        this.request = request;
        this.response = response;
        this.processed = processed;
    }
}