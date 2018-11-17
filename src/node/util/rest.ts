import {Context} from "../storage/Context";
import {IncomingMessage, ServerResponse} from "http";

export function matchUrl(url: string,
                         urlPattern: string,
                         context: Context,
                         request: IncomingMessage,
                         response: ServerResponse,
                         processor: (context: Context, request: IncomingMessage, response: ServerResponse, pathParams: Map<string, string>) => void): boolean {
    let idNames = match('/api/regions/:regionId/users', ':([a-zA-Z]*)');
    var modifiedUrlPattern = urlPattern;
    if (idNames !== undefined) {
        idNames.forEach(param => {
            modifiedUrlPattern = modifiedUrlPattern.replace(":" + param, "([a-zA-Z0-9-]*)");
        });
    }
    let idValues = match(url, "^" + modifiedUrlPattern + "$");
    if (idValues === undefined) {
        return false;
    }
    let parameters = new Map<string, string>();
    if (idNames) {
        for (let i = 0; i < idNames.length; i++) {
            parameters.set(idNames[i], idValues[i]);
        }
    }

    console.log("\n" + request.method +": " + request.url + " " + JSON.stringify(request.headers));
    processor(context, request, response, parameters);
    return true;
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