export class FileContent {
    mimeType: string;
    readableStream: ReadableStream;

    constructor(mimeType: string, readableStream: ReadableStream) {
        this.mimeType = mimeType;
        this.readableStream = readableStream;
    }
}