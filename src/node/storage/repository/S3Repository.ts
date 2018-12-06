import {Repository} from "./Repository";

const config = require('config');
import AWS = require('aws-sdk');
import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";
import SendData = ManagedUpload.SendData;
import {DeleteObjectOutput, GetObjectOutput} from "aws-sdk/clients/s3";
const Readable = require('stream').Readable;

export class S3Repository implements Repository {

    s3: AWS.S3;
    bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;
        const accessKeyId = config.get('AWS.accessKeyId');
        const secretAccessKey = config.get('AWS.secretAccessKey');
        const region = config.get('AWS.region');
        AWS.config.update({ accessKeyId, secretAccessKey, region });
        this.s3 = new AWS.S3({apiVersion: '2006-03-01'});
    }

    async save(fileName: string, fileContent: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const readable = new Readable();
            readable.push(fileContent);
            readable.push(null);
            this.s3.upload ({Bucket: this.bucketName, Key: fileName, Body: readable},
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
        return new Promise<string>((resolve, reject) => {
            this.s3.getObject({ Bucket: this.bucketName, Key: fileName },
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

    async delete(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const params = {
                Bucket: this.bucketName,
                Key: fileName
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