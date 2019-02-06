import {Repository} from "./Repository";

const config = require('config');
import AWS = require('aws-sdk');
import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";
import SendData = ManagedUpload.SendData;
import {DeleteObjectOutput, GetObjectOutput, ListObjectsOutput} from "aws-sdk/clients/s3";
import {FileContent} from "./model/FileContent";
const Readable = require('stream').Readable;
const mime = require('mime-types');

export class S3Repository implements Repository {

    s3: AWS.S3;
    bucketName: string;
    repositoryPath = '/';

    constructor(bucketName: string) {
        this.bucketName = bucketName;
        const accessKeyId = config.get('AWS.accessKeyId');
        const secretAccessKey = config.get('AWS.secretAccessKey');
        const region = config.get('AWS.region');
        AWS.config.update({ accessKeyId, secretAccessKey, region });
        this.s3 = new AWS.S3({apiVersion: '2006-03-01'});
    }

    async startup(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.s3.listObjects({Bucket: this.bucketName}, function (err: Error, data: ListObjectsOutput) {
                if (err) {
                    reject(err);
                } if (data) {
                    resolve();
                }
            });

        });
    }

    async save(fileName: string, fileContent: string): Promise<void> {
        if (fileName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + fileName);
        }

        return new Promise<void>((resolve, reject) => {
            const mimeType = mime.lookup(fileName);
            const readable = new Readable();
            readable.push(fileContent);
            readable.push(null);
            this.s3.upload ({Bucket: this.bucketName, Key: this.repositoryPath + fileName, ContentType: mimeType, Body: readable},
                function (err: Error, data: SendData) {
                if (err) {
                    reject(err);
                } if (data) {
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
            this.s3.getObject({ Bucket: this.bucketName, Key: this.repositoryPath + fileName },
                function (err: Error, data: GetObjectOutput) {
                    if (err != null) {
                        if ((err as any).code === 'NoSuchKey') {
                            resolve('');
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(data.Body!!.toString());
                    }
                }
            );
        });
    }

    async saveFile(fileName: string, buffer: Buffer): Promise<void> {
        if (fileName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + fileName);
        }

        return new Promise<void>((resolve, reject) => {
            const mimeType = mime.lookup(fileName);
            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);
            this.s3.upload ({Bucket: this.bucketName, Key: this.repositoryPath + fileName, ContentType: mimeType, Body: readable},
                function (err: Error, data: SendData) {
                    if (err) {
                        reject(err);
                    } if (data) {
                        resolve();
                    }
                });
        });
    }

    async loadFile(fileName: string): Promise<FileContent | undefined> {
        if (fileName.indexOf('..') > -1) {
            throw new Error("Only absolute paths allowed: " + fileName);
        }

        return new Promise<FileContent | undefined>((resolve, reject) => {
            this.s3.getObject({ Bucket: this.bucketName, Key: this.repositoryPath + fileName },
                function (err: Error, data: GetObjectOutput) {
                    if (err != null) {
                        if ((err as any).code === 'NoSuchKey') {
                            resolve(undefined);
                        } else {
                            reject(err);
                        }
                    } else {
                        data.Body
                        resolve(new FileContent(data.ContentType!!, data.Body as Buffer));
                    }
                }
            );
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
            this.s3.listObjectsV2({ Bucket: this.bucketName, MaxKeys: 500, Delimiter: '/', Prefix: this.repositoryPath + directoryName },
                function (err: Error, data: ListObjectsOutput) {
                    if (err != null) {
                        if ((err as any).code === 'NoSuchKey') {
                            resolve([]);
                        } else {
                            reject(err);
                        }
                    } else {
                        const directories = new Array<string>();
                        console.log(JSON.stringify(data, null, 2));
                        if (data.Contents) {
                            for (const object of data.Contents) {
                                if (object.Key) {
                                    directories.push(object.Key.substring(directoryName.length + 1));
                                }
                            }
                        }
                        resolve(directories);
                    }
                }
            );
        });
    }

    async delete(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const params = {
                Bucket: this.bucketName,
                Key: this.repositoryPath + fileName
            };
            this.s3.deleteObject(params, function(err: Error, data: DeleteObjectOutput) {
                if (err) {
                    reject(err);
                } if (data) {
                    resolve();
                }
            });
        });
    }

}