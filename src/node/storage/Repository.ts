import {FileContent} from "./model/FileContent";

export interface Repository {

    startup(): Promise<void>;

    save(fileName: string, fileContent: string): Promise<void>;

    load(fileName: string): Promise<string>;

    delete(fileName: string): Promise<string>;

    saveFile(fileName: string, buffer: ReadableStream): Promise<void>;

    loadFile(fileName: string): Promise<FileContent | undefined>;

    listFiles(directoryName: string): Promise<Array<string>>;

}