import {Repository} from "./Repository";

const fs = require('fs');

export class FileSystemRepository implements Repository {

    async save(fileName: string, fileContent: string) {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(fileName, fileContent, function (err: Error) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    async load(fileName: string) {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(fileName, function (err: Error, fileContent: string) {
                if (err) {
                    reject(err);
                }
                resolve(fileContent);
            });
        });
    }

}