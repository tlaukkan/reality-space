import {Context} from "../../common/dataspace/Context";
import {RestApiContext} from "../../common/dataspace/RestApiContext";
import {info, warn} from "./log";

export class Processors {
    GET: undefined | ((requestContext: RestApiContext) => Promise<void>) = undefined;
    POST: undefined | ((requestContext: RestApiContext) => Promise<void>) = undefined;
    PUT: undefined | ((requestContext: RestApiContext) => Promise<void>) = undefined;
    DELETE: undefined | ((requestContext: RestApiContext) => Promise<void>) = undefined;


    constructor(GET: ((requestContext: RestApiContext) => Promise<void>) | undefined = undefined, POST: ((requestContext: RestApiContext) => Promise<void>) | undefined = undefined, PUT: ((requestContext: RestApiContext) => Promise<void>) | undefined = undefined, DELETE: ((requestContext: RestApiContext) => Promise<void>) | undefined = undefined) {
        this.GET = GET;
        this.POST = POST;
        this.PUT = PUT;
        this.DELETE = DELETE;
    }
}

export async function match(context: RestApiContext,
                            urlPattern: string,
                            processors: Processors): Promise<RestApiContext> {
    if (context.processed) {
        return context;
    }
    const idNames = matchPattern(urlPattern, ':([a-zA-Z]*)');
    let modifiedUrlPattern = urlPattern;
    if (idNames !== undefined) {
        idNames.forEach(param => {
            modifiedUrlPattern = modifiedUrlPattern.replace(":" + param, "([a-zA-Z0-9-]*)");
        });
    }
    const idValues = matchPattern(context.request.url!!, "^" + modifiedUrlPattern + "$");
    if (idValues === undefined) {
        return context;
    }

    const parameters = new Map<string, string>();
    if (idNames) {
        for (let i = 0; i < idNames.length; i++) {
            parameters.set(idNames[i], idValues[i]);
        }
    }

    //console.log(parameters);

    const updatedContext = new RestApiContext(context.context, context.request, context.response, parameters, true);

    const processor = (processors as any)[context.request.method!!] as (requestContext: RestApiContext) => Promise<void>;
    if (!processor) {
        warn(context, "405 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers));
        context.response.writeHead(405, {'Content-Type': 'text/plain'});
        context.response.end();
        return updatedContext;
    }


    try {
        await processor(updatedContext);
        info(context, "200 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers));
    } catch(error) {
        error(context, "500 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers), error);
        context.response.writeHead(500, {'Content-Type': 'text/plain'});
        context.response.end();
    }

    return updatedContext;
}

function matchPattern(str: string, pattern: string) {
    let match = str!!.match(pattern);

    if (match != null) {
        let params = [];
        for (let i = 1; i < match.length; i++) {
            params.push(match[i]);
        }
        return params;
    }
    return undefined;
}

export function respond(context: Context, object: object) {
    context.response.write(JSON.stringify(object));
    context.response.writeHead(200, {'Content-Type': 'text/json'});
    context.response.end();
}