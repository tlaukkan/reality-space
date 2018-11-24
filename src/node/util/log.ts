import {RestApiContext} from "../../common/dataspace/RestApiContext";
import {Context} from "../../common/dataspace/Context";

require('console-stamp')(console, {
    pattern: 'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
    //metadata: function () { return ('[' + process.memoryUsage().rss + ']'); },
    colors: { stamp: 'yellow', label: 'white', metadata: 'green' }
});

export function info(context: Context, message:string) {
    const contextString = formatContextString(context.context.tokenId, context.context.requestId, context.context.issuer, context.context.userId);
    console.log(contextString + " > " + message);
}

export function warn(context: Context, message:string) {
    const contextString = formatContextString(context.context.tokenId, context.context.requestId, context.context.issuer, context.context.userId);
    console.warn(contextString + " > " + message);
}

export function error(context: Context, message:string, error: any) {
    const contextString = formatContextString(context.context.tokenId, context.context.requestId, context.context.issuer, context.context.userId);
    console.error(contextString + " > " + message);
    console.error(error);
}

export function warnWithRequestId(requestId: string, message:string) {
    const contextString = formatContextString('', requestId, '', '');
    console.error(contextString + " > " + message);
}

export function errorWithRequestId(requestId: string, message:string, error: any) {
    const contextString = formatContextString('', requestId, '', '');
    console.error(contextString + " > " + message);
    console.error(error);
}

function formatContextString(tokenId: string, sessionId: string, requestId: string, userId: string) {
    return pad(tokenId.substring(0, 8), 8, ' ') + ' ' + pad(sessionId.substring(0, 8), 8, ' ') + ' ' + pad(requestId.substring(0, 8), 8, ' ') + ' ' + pad(userId.substring(0, 8), 8, ' ');
}

function pad(string: string, padlen: number, padchar: string) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + string).slice(-pad.length);
}