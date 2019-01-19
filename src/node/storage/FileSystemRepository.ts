import {Repository} from "./Repository";

const fs = require('fs');
const path = require('path');

export class FileSystemRepository implements Repository {
    repositoryPath = 'repository/';

    existingDirectories: Set<string> = new Set();

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
        this.ensureDirectoryExists(this.repositoryPath + fileName);
        return new Promise<void>((resolve, reject) => {

            fs.writeFile(this.repositoryPath + fileName, fileContent, function (err: Error) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async load(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(this.repositoryPath + fileName, function (err: Error, fileContent: string) {
                if(err && (err as any).code == 'ENOENT') {
                    resolve('');
                } else if (err) {
                    reject(err);
                } else if (fileContent) {
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
                } else if (err) {
                    reject(err);
                }
                resolve();
            });
        });

    }


    ensureDirectoryExists(filePath: string) {
        const sep = '/';
        const lastSepIndex = filePath.replace("\\",sep).lastIndexOf(sep);
        if (lastSepIndex > -1) {
            const directoryPath = filePath.substring(0, lastSepIndex);
            if (!this.existingDirectories.has(directoryPath)) {
                console.log("dataspace server: ensuring directory exists - " + filePath);
                this.mkDirByPathSync(directoryPath);
                this.existingDirectories.add(directoryPath);
            }
        }
    }

    mkDirByPathSync(targetDir: string) {
        const sep = '/';
        const initDir = path.isAbsolute(targetDir) ? sep : '';
        const baseDir = '.';

        return targetDir.split(sep).reduce((parentDir, childDir) => {
            const curDir = path.resolve(baseDir, parentDir, childDir);
            try {
                fs.mkdirSync(curDir);
            } catch (err) {
                if (err.code === 'EEXIST') { // curDir already exists!
                    return curDir;
                }

                if (err.code === 'ENOENT') {
                    throw new Error("EACCES: permission denied, mkdir '${parentDir}'");
                }

                const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
                if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                    throw err; // Throw if it's just the last created dir.
                }
            }
            return curDir;
        }, initDir);
    }

}