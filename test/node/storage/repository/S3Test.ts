import { expect } from 'chai';
const config = require('config');

import AWS = require('aws-sdk');

describe('S3 test.', () => {

    it('should test S3', (done) => {
        const accessKeyId = config.get('AWS.accessKeyId');
        const secretAccessKey = config.get('AWS.secretAccessKey');
        const region = config.get('AWS.region');
        console.log(region);
        AWS.config.update(
            {
                accessKeyId,
                secretAccessKey,
                region
            }
        );

        // Create S3 service object
        const s3 = new AWS.S3({apiVersion: '2006-03-01'});

        const bucketParams = {
            Bucket : 'dataspace-eu'
        };

        // Call S3 to create the bucket
        s3.listObjects(bucketParams, function(err, data) {
            if (err) {
                console.log("Error", err);
                done();
            } else {
                console.log("Success", data);
                done();
            }
        });
    });


});