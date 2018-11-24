import {Context} from "../../common/dataspace/Context";
import {RestApiContext} from "../../common/dataspace/RestApiContext";
import {info} from "./log";

export async function match(context: RestApiContext,
                            urlPattern: string,
                            processor: (requestContext: RestApiContext) => Promise<void>): Promise<RestApiContext> {
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