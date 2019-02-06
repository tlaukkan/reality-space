export class FileContent {
    mimeType: string;
    buffer: Buffer;

    constructor(mimeType: string, buffer: Buffer) {
        this.mimeType = mimeType;
        this.buffer = buffer;
    }
}