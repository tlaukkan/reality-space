import {RestApiContext} from "./RestApiContext";
import {error, info, warn} from "../../util/log";

const CACHE_REGEXP = new Map<string, RegExp>();
const CACHE_REGEXP_WITH_GLOBAL_FLAG = new Map<string, RegExp>();

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

export enum BodyEncoding {
    JSON,
    XML
}

export async function match(context: RestApiContext,
                            urlPattern: string,
                            bodyEncoding: BodyEncoding,
                            processors: Processors): Promise<RestApiContext> {
    if (context.processed) {
        return context;
    }

    const pathParamNames = matchPatternGlobal(urlPattern, '\\{([a-zA-Z]*)\\}');
    const urlRegExpPattern = pathParamNames && pathParamNames.length > 0 ? pathParamNames.reduce(function(u, p) {
        return u.replace(p, "([a-zA-Z0-9-_]*)");
    }, urlPattern) : urlPattern;


    const pathParamValues = matchPattern(context.request.url!!, "^" + urlRegExpPattern + "$");

    if (pathParamValues === undefined) {
        // No URL match.
        return context;
    }

    const parameters = pathParamNames ? pathParamNames!!.reduce(function(map: Map<string, string>, idName: string, i: number) {
        return new Map<string, string>(map).set(idName.substring(1, idName.length - 1), pathParamValues[i]);
    }, new Map<string, string>()) : new Map<string, string>();

    const updatedContext = new RestApiContext(context.principal, context.request, context.response, true, parameters, undefined);

    const processor = (processors as any)[context.request.method!!] as (requestContext: RestApiContext) => Promise<void>;

    if (!processor) {
        // Matching url pattern found but no processor implementation defined.
        setResponse(context, 405);
        return updatedContext;
    }

    try {
        await processRequest(updatedContext, bodyEncoding, processor);
    } catch (err) {
        setResponseWithError(context, err, 500);
    }

    return updatedContext;
}

export function processRequest(context: RestApiContext, bodyEncoding: BodyEncoding, processor: ((requestContext: RestApiContext) => Promise<any>)) {
    const body = Array<Uint8Array>();
    context.request.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        await onRequestEnd(body, bodyEncoding, processor, context);
    }).on('error', (err) => {
        setResponseWithError(context, err, 500);
    });
}

async function onRequestEnd(body: Array<Uint8Array>, bodyEncoding: BodyEncoding, processor: (requestContext: RestApiContext) => Promise<any>, context: RestApiContext) {
    try {
        const requestBodyString = Buffer.concat(body).toString();
        if (requestBodyString) {
            const requestBody = bodyEncoding === BodyEncoding.JSON ? JSON.parse(requestBodyString) : requestBodyString;
            const responseBody = await processor({...context, body: requestBody});
            if (responseBody) {
                startResponse(context, 200, bodyEncoding);
                context.response.write(bodyEncoding === BodyEncoding.JSON ? JSON.stringify(responseBody) : responseBody);
                endResponse(context);
            } else {
                if (context.request.method === "DELETE") {
                    setResponse(context, 200);
                } else {
                    setResponse(context, 404);
                }
            }
        } else {
            const responseBody = await processor(context);
            if (responseBody) {
                startResponse(context, 200, bodyEncoding);
                context.response.write(bodyEncoding === BodyEncoding.JSON ? JSON.stringify(responseBody) : responseBody);
                endResponse(context);
            } else {
                if (context.request.method === "DELETE") {
                    setResponse(context, 200);
                } else {
                    setResponse(context, 404);
                }
            }
        }
    } catch (err) {
        if (err.message.indexOf("access denied") != -1) {
            warn(context.principal, err.message);
            setResponse(context, 403);
        } else {
            setResponseWithError(context, err, 500);
        }
    }
}

function startResponse(context: RestApiContext, httpStatusCode: number, bodyEncoding: BodyEncoding) {
    info(context.principal, httpStatusCode.toString() + " " + context.request.method + ": " + context.request.url + " ");
    context.response.statusCode = 200;
    if (bodyEncoding == BodyEncoding.JSON) {
        context.response.setHeader('Content-Type', 'application/json');
    } else if (bodyEncoding == BodyEncoding.XML) {
        context.response.setHeader('Content-Type', 'application/xml');
    } else {
        context.response.setHeader('Content-Type', 'text/plain');
    }
    context.response.setHeader('Access-Control-Allow-Origin', '*');
    context.response.setHeader('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE');
}

function endResponse(context: RestApiContext) {
    context.response.end();
}

function setResponse(context: RestApiContext, httpStatusCode: number) {
    info(context.principal, httpStatusCode.toString() + " " + context.request.method + ": " + context.request.url + " ");
    context.response.writeHead(httpStatusCode, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE'});
    context.response.end();
}

function setResponseWithError(context: RestApiContext, err: Error, httpStatusCode: number) {
    error(context.principal, httpStatusCode.toString() + " " + context.request.method + ": " + context.request.url + " ", err);
    context.response.writeHead(httpStatusCode, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE'});
    context.response.end();
}

function matchPatternGlobal(str: string, pattern: string) {
    let match = str!!.match(buildRegExpWithGlobalFlag(pattern));
    if (match != null) {
        return Array.from(match);
    }
    return undefined;
}

function matchPattern(str: string, pattern: string) {
    let match = str!!.match(buildRegExp(pattern));
    if (match != null) {
        return Array.from(match).splice(1);
    }
    return undefined;
}

function buildRegExp(pattern: string): RegExp {
    if (!CACHE_REGEXP.has(pattern)) {
        CACHE_REGEXP.set(pattern, new RegExp(pattern));
    }
    return CACHE_REGEXP.get(pattern)!!;
}


function buildRegExpWithGlobalFlag(pattern: string): RegExp {
    if (!CACHE_REGEXP_WITH_GLOBAL_FLAG.has(pattern)) {
        CACHE_REGEXP_WITH_GLOBAL_FLAG.set(pattern, new RegExp(pattern, "g"));
    }
    return CACHE_REGEXP_WITH_GLOBAL_FLAG.get(pattern)!!;
}
