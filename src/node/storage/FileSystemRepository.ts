import {Repository} from "./Repository";
import {PathLike} from "fs";

const fs = require('fs');

export class FileSystemRepository implements Repository {
    repositoryPath = 'repository/servers/';

    async startup(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.access(this.repositoryPath, fs.F_OK, (err: Error) => {
                if (err) {
                    console.error(err)
                    reject(err);
                }
                resolve();
            })
        });
    }

    async save(fileName: string, fileContent: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            fs.writeFile(this.repositoryPath + fileName, fileContent, function (err: Error) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    async load(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(this.repositoryPath + fileName, function (err: Error, fileContent: string) {
                if(err && (err as any).code == 'ENOENT') {
                    resolve('');
                }
                if (err) {
                    reject(err);
                }
                if (fileContent) {
                    resolve(fileContent.toString());
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    async delete(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.unlink(this.repositoryPath + fileName, function (err: Error) {
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