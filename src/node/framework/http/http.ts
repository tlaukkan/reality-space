import {IncomingMessage, ServerResponse} from "http";
import {Context} from "./Context";
import {info, warnWithRequestId} from "../../util/log";
import {decodeIdToken, validateIdToken} from "../../../common/util/jwt";
import {Principal} from "../rest/Principal";
import {IdTokenIssuer} from "../../../common/dataspace/Configuration";

export async function processRequest(request: IncomingMessage, response: ServerResponse, handlers: Array<(c: Context) => Promise<Context>>, issuers: Map<string, IdTokenIssuer>): Promise<void> {
    try {
        if (request.url === '/health') {
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end();
            return;
        }

        let context = authorizeRequest(request, response, issuers);
        if (!context) {
            response.writeHead(401, {'Content-Type': 'text/plain'});
            response.end();
            return;
        }

        for (const handler of handlers) {
            if ((await handler(context)).processed) {
                return;
            }
        }

        info(context.principal, "404 " + request.method + ": " + request.url + " not found");
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end();
        return;
    } catch (error) {
        console.log("500 " + request.method + ": " + request.url + " error processing request.");
        console.warn(error);
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.end();
        return;
    }
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
        const principal = new Principal(issuer, claims.get("jti") as string, requestId, claims.get("id")!! as string, claims.get("name")!!  as string);
        return new Context(principal, request, response, false);
    } catch (error) {
        warnWithRequestId(requestId, "Error decoding authorization token.");
        return undefined;
    }
}