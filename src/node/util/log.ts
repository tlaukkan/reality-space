import {RestApiContext} from "../server/RestApiContext";
import {Context} from "../server/Principal";
import {Principal} from "../../common/dataspace/Principal";

require('console-stamp')(console, {
    pattern: 'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
    //metadata: function () { return ('[' + process.memoryUsage().rss + ']'); },
    colors: { stamp: 'yellow', label: 'white', metadata: 'green' }
});

export function info(context: Principal, message:string) {
    const contextString = formatContextString(context.requestId, context.tokenId, context.issuer, context.userId);
    console.log(contextString + " > " + message);
}

export function warn(context: Principal, message:string) {
    const contextString = formatContextString(context.requestId, context.tokenId, context.issuer, context.userId);
    console.warn(contextString + " > " + message);
}

export function error(context: Principal, message:string, error: any) {
    const contextString = formatContextString(context.requestId, context.tokenId, context.issuer, context.userId);
    console.error(contextString + " > " + message);
    console.error(error);
}

export function warnWithRequestId(requestId: string, message:string) {
    const contextString = formatContextString(requestId, '', '', '');
    console.error(contextString + " > " + message);
}

export function errorWithRequestId(requestId: string, message:string, error: any) {
    const contextString = formatContextString(requestId, '', '', '');
    console.error(contextString + " > " + message);
    console.error(error);
}

function formatContextString(requestId: string, tokenId: string, issuer: string, userId: string) {
    return pad(requestId.substring(0, 11)) + pad(tokenId.substring(0, 11)) + pad(issuer.substring(0, 11)) + pad(userId.substring(0, 11));
}

function pad(str: string) {
    const pad = '            ';
    return (str + pad).substring(0, pad.length);
}