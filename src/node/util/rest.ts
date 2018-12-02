import {Context} from "../server/Context";
import {RestApiContext} from "../server/RestApiContext";
import {error, info, warn} from "./log";

export class Processors {
    GET: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;
    POST: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;
    PUT: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;
    DELETE: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;


    constructor(GET: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined, POST: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined, PUT: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined, DELETE: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined) {
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
    const idNames = matchPatternGlobal(urlPattern, '\\{([a-zA-Z]*)\\}');
    let modifiedUrlPattern = urlPattern;
    if (idNames !== undefined) {
        idNames.forEach(param => {
            modifiedUrlPattern = modifiedUrlPattern.replace(param, "([a-zA-Z0-9-]*)");
        });
    }
    const idValues = matchPattern(context.request.url!!, "^" + modifiedUrlPattern + "$");
    if (idValues === undefined) {
        return context;
    }

    const parameters = new Map<string, string>();
    if (idNames) {
        for (let i = 0; i < idNames.length; i++) {
            parameters.set(idNames[i].substring(1, idNames[i].length - 1), idValues[i]);
        }
    }

    //console.log(parameters);

    const updatedContext = new RestApiContext(context.context, context.request, context.response, true, parameters, undefined);

    const processor = (processors as any)[context.request.method!!] as (requestContext: RestApiContext) => Promise<void>;
    if (!processor) {
        warn(context.context, "405 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers));
        context.response.writeHead(405, {'Content-Type': 'text/plain'});
        context.response.end();
        return updatedContext;
    }


    try {
        if (context.request.method === "POST" || context.request.method === "PUT") {
            await collectBody(updatedContext, processor);
        } else {
            await collectBody(updatedContext, processor);
        }
        info(context.context, "200 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers));
    } catch (error) {
        error(context, "500 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers), error);
        context.response.writeHead(500, {'Content-Type': 'text/plain'});
        context.response.end();
    }

    return updatedContext;
}

function matchPatternGlobal(str: string, pattern: string) {
    let match = str!!.match(new RegExp(pattern, "g"));
    if (match != null) {
        let params = [];
        for (let i = 0; i < match.length; i++) {
            params.push(match[i]);
        }
        return params;
    }
    return undefined;
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


export function collectBody(context: RestApiContext, processor: ((requestContext: RestApiContext) => Promise<any>)) {
    const body = Array<Uint8Array>();
    context.request.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        try {
            const requestBodyJson = Buffer.concat(body).toString();
            if (requestBodyJson) {
                const requestBodyObj = JSON.parse(requestBodyJson);
                const responseBody = await processor({...context, body: requestBodyObj});
                if (responseBody) {
                    context.response.write(JSON.stringify(responseBody));
                }
            } else {
                const responseBody = await processor(context);
                if (responseBody) {
                    context.response.write(JSON.stringify(responseBody));
                }
            }
            context.response.writeHead(200, {'Content-Type': 'text/json'});
            context.response.end();
        } catch (err) {
            error(context.context, "500 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers), err);
            context.response.writeHead(500, {'Content-Type': 'text/plain'});
            context.response.end();
        }
    }).on('error', (err) => {
        error(context.context, "500 " + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers), err);
        context.response.writeHead(500, {'Content-Type': 'text/plain'});
        context.response.end();
    });
}