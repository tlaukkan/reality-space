import {IncomingMessage, ServerResponse} from "http";
import {Context} from "./Context";
import {error, info, warnWithRequestId} from "../../util/log";
import {decodeIdToken, validateIdToken} from "../../../common/util/jwt";
import {Principal} from "../rest/Principal";
import {IdTokenIssuer} from "../../../common/dataspace/Configuration";
import * as fs from "fs";
const mime = require('mime-types');

export async function processRequest(request: IncomingMessage, response: ServerResponse, handlers: Array<(c: Context) => Promise<Context>>, issuers: Map<string, IdTokenIssuer>): Promise<void> {
    try {
        if (request.url === '/health') {
            response.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE'});
            response.end();
            return;
        }

        let context = authorizeRequest(request, response, issuers);
        if (!context) {
            response.writeHead(401, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE'});
            response.end();
            return;
        }

        /*if (request.url!!.startsWith('/repository')) {
            await serveStaticFiles(request, response);
            return;
        }*/

        for (const handler of handlers) {
            if ((await handler(context)).processed) {
                return;
            }
        }

        info(context.principal, "404 " + request.method + ": " + request.url + " not found");
        response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE'});
        response.end();
        return;
    } catch (error) {
        console.log("500 " + request.method + ": " + request.url + " error processing request.");
        console.warn(error);
        response.writeHead(500, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE'});
        response.end();
        return;
    }
}

function serveStaticFiles(request: IncomingMessage, response: ServerResponse): Promise<void> {
    return new Promise<void>((resolve, reject) => {

        const filePath = '.' + request.url;

        //console.log('serving: ' + filePath);

        if (filePath.indexOf('..') != -1) {
            response.writeHead(404);
            response.end();
            resolve();
            return;
        }

        const contentType = mime.lookup(filePath);
        if (contentType !== "application/xml") {
            response.writeHead(404);
            response.end();
            resolve();
            return;
        }

        fs.readFile(filePath, function (error, content) {
            if (error) {
                if (error.code == 'ENOENT') {
                    endResponseWithError(request, response, error, 404);
                    resolve();
                } else {
                    endResponseWithError(request, response, error, 500);
                    resolve();
                }
            } else {
                response.writeHead(200, {'Content-Type': contentType, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE'});
                response.end(content, 'utf-8');
                resolve();
            }
        });
    });
}


function authorizeRequest(request: IncomingMessage, response: ServerResponse, issuers: Map<string, IdTokenIssuer>): Context | undefined {
    const requestId = request.headers['request-id'] as string;
    if (!requestId) {
        warnWithRequestId("", "Request-ID header does not exist.");
        return undefined;
    }

    try {

        if (!request.headers.authorization) {
            warnWithRequestId(requestId, "Authorization header does not exist.");
            return undefined;
        } else if (!request.headers.authorization.startsWith("Bearer ")) {
            warnWithRequestId(requestId, "Authorization header does not contain Bearer token.");
            return undefined;
        }
        const idToken = request.headers.authorization.substring("Bearer ".length);
        const issuer = decodeIdToken(idToken).get("iss") as string;
        if (!issuer) {
            warnWithRequestId(requestId, "Issuer claim not found.");
            return undefined;
        }
        const idTokenIssuer = issuers.get(issuer!! as string)!!;
        if (!idTokenIssuer) {
            warnWithRequestId(requestId, "Issuer not found: " + issuer);
            return undefined;
        }
        const claims = validateIdToken(idToken, idTokenIssuer.publicKey);
        if (!claims.has("id") || !claims.has("exp") || !claims.has("name") || !claims.get("jti")) {
            warnWithRequestId(requestId, "Missing mandatory claims.");
            return undefined;
        }
        const groupsString = claims.get("groups");
        const groups = groupsString ? groupsString.split(",") : undefined;
        const principal = new Principal(issuer, claims.get("jti") as string, requestId, claims.get("id")!! as string, claims.get("name")!!  as string, groups);
        return new Context(principal, request, response, false);
    } catch (error) {
        warnWithRequestId(requestId, "Error decoding authorization token.");
        return undefined;
    }
}

export function endResponseWithError(request: IncomingMessage, response: ServerResponse, err: Error, httpStatusCode: number) {
    error(new Principal("", "", "", "", "", undefined), httpStatusCode.toString() + " " + request.method + ": " + request.url + " ", err);
    response.writeHead(httpStatusCode, {'Content-Type': 'text/plain'});
    response.end();
}