import {RequestContext} from "../../common/dataspace/RequestContext";

export async function matchUrl(requestContext: RequestContext,
                         urlPattern: string,
                         processor: (requestContext: RequestContext, pathParams: Map<string, string>) => Promise<void>): Promise<RequestContext> {
    if (requestContext.processed) {
        return requestContext;
    }
    let idNames = match('/api/regions/:regionId/users', ':([a-zA-Z]*)');
    var modifiedUrlPattern = urlPattern;
    if (idNames !== undefined) {
        idNames.forEach(param => {
            modifiedUrlPattern = modifiedUrlPattern.replace(":" + param, "([a-zA-Z0-9-]*)");
        });
    }
    let idValues = match(requestContext.request.url!!, "^" + modifiedUrlPattern + "$");
    if (idValues === undefined) {
        return requestContext;
    }
    let parameters = new Map<string, string>();
    if (idNames) {
        for (let i = 0; i < idNames.length; i++) {
            parameters.set(idNames[i], idValues[i]);
        }
    }

    console.log("\n" + requestContext.request.method +": " + requestContext.request.url + " " + JSON.stringify(requestContext.request.headers));
    try {
        await processor(requestContext, parameters);
    } catch(error) {
        console.log(error);
        requestContext.response.writeHead(500, {'Content-Type': 'text/plain'});
        requestContext.response.end();
    }
    return new RequestContext(requestContext.context, requestContext.request, requestContext.response, true);
}

export function match(str: string, pattern: string) {
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