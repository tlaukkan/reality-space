import {Context} from "../../common/dataspace/Context";
import {RestApiContext} from "../../common/dataspace/RestApiContext";

export async function match(context: RestApiContext,
                            urlPattern: string,
                            processor: (requestContext: RestApiContext) => Promise<void>): Promise<RestApiContext> {
    if (context.processed) {
        return context;
    }
    let idNames = matchPattern('/api/regions/:regionId/users', ':([a-zA-Z]*)');
    var modifiedUrlPattern = urlPattern;
    if (idNames !== undefined) {
        idNames.forEach(param => {
            modifiedUrlPattern = modifiedUrlPattern.replace(":" + param, "([a-zA-Z0-9-]*)");
        });
    }
    let idValues = matchPattern(context.request.url!!, "^" + modifiedUrlPattern + "$");
    if (idValues === undefined) {
        return context;
    }
    let parameters = new Map<string, string>();
    if (idNames) {
        for (let i = 0; i < idNames.length; i++) {
            parameters.set(idNames[i], idValues[i]);
        }
    }

    console.log("\n" + context.request.method +": " + context.request.url + " " + JSON.stringify(context.request.headers));
    try {
        await processor(context);
    } catch(error) {
        console.log(error);
        context.response.writeHead(500, {'Content-Type': 'text/plain'});
        context.response.end();
    }
    return new RestApiContext(context.context, context.request, context.response, parameters, true);
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