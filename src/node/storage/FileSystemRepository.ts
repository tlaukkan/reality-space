import {Repository} from "./Repository";
import {FileContent} from "./model/FileContent";

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

export class FileSystemRepository implements Repository {
    repositoryPath = 'repository/';

    existingDirectories: Set<string> = new Set();

    async startup(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.access(this.repositoryPath, fs.F_OK, (err: Error) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                resolve();
            })
        });
    }

    async save(fileName: string, fileContent: string): Promise<void> {
        if (fileName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + fileName);
        }
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
        if (fileName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + fileName);
        }

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

    async saveFile(fileName: string, readableStream: ReadableStream): Promise<void> {
        if (fileName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + fileName);
        }
        const mimeType = mime.lookup(fileName);
        this.ensureDirectoryExists(this.repositoryPath + fileName);
        const fileExtension = mime.extension(mimeType);
        if (!fileName.endsWith(fileExtension)) {
            throw new Error("Invalid file extension for mime type: " + mimeType);
        }
        return new Promise<void>((resolve, reject) => {
            // This line opens the file as a readable stream
            const writeStream = fs.createWriteStream(this.repositoryPath + fileName);

            writeStream.on('finish', function () {
                resolve();
            });

            // This catches any errors that happen while creating the readable stream (usually invalid names)
            writeStream.on('error', function(err: Error) {
                if(err && (err as any).code == 'ENOENT') {
                    reject(err);
                } else if (err) {
                    reject(err);
                }
            });

            // This will wait until we know the readable stream is actually valid before piping
            (readableStream as any).pipe(writeStream);
        });
    }

    async loadFile(fileName: string): Promise<FileContent | undefined> {
        if (fileName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + fileName);
        }

        const mimeType = mime.lookup(fileName);
        return new Promise<FileContent | undefined>((resolve, reject) => {
            // This line opens the file as a readable stream
            const readStream = fs.createReadStream(this.repositoryPath + fileName);

            // This will wait until we know the readable stream is actually valid before piping
            readStream.on('open', function () {
                // This just pipes the read stream to the response object (which goes to the client)
                resolve(new FileContent(mimeType, readStream));
            });

            // This catches any errors that happen while creating the readable stream (usually invalid names)
            readStream.on('error', function(err: Error) {
                if(err && (err as any).code == 'ENOENT') {
                    resolve(undefined);
                } else if (err) {
                    reject(err);
                }
            });

        });
    }

    listFiles(directoryName: string): Promise<Array<string>> {
        if (directoryName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + directoryName);
        }
        if (!directoryName.endsWith('/')) {
            throw new Error("Directory name has to end to /.");
        }

        return new Promise<Array<string>>((resolve, reject) => {
            fs.readdir(this.repositoryPath + directoryName, function (err: Error, items: Array<string>) {
                if (err && (err as any).code == 'ENOENT') {
                    resolve([]);
                } else if (err) {
                    reject(err);
                } else if (items) {
                    resolve(items);
                } else {
                    reject("No file content.");
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
                //console.log("reality server - ensuring directory exists - " + filePath);
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