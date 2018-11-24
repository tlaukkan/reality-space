import {Repository} from "./Repository";

const fs = require('fs');

export class FileSystemRepository implements Repository {

    async save(fileName: string, fileContent: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(fileName, fileContent, function (err: Error) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    async load(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(fileName, function (err: Error, fileContent: string) {
                if(err && (err as any).code == 'ENOENT') {
                    resolve('');
                }
                if (err) {
                    reject(err);
                }
                resolve(fileContent);
            });
        });
    }

    async delete(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.unlink('./server/upload/my.csv', function (err: Error) {
                if (err && (err as any).code == 'ENOENT') {
                    resolve();
                }
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });

    }

}