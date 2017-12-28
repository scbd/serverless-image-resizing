'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;

exports.handler = function(event, context, callback) {
  const key = event.queryStringParameters.key;
  const match = key.match(/(\d+)x(\d+)\/(.*)/);
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  const originalKey = match[3];
  let s3ObjectOptions = {};

  S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
    .then(data => {
      s3ObjectOptions = {
        Key :  key,
        Metadata : data.Metadata,
        ContentType : data.ContentType,
        Bucket: BUCKET
      }
      return Sharp(data.Body)
            .resize(width, height)
            .max()
            .toBuffer()
    })
    .then(buffer => {
      s3ObjectOptions.Body = buffer;
      // console.log(s3ObjectOptions);
      S3.putObject(s3ObjectOptions).promise()
    })
    .then(() => callback(null, {
        statusCode: '301',
        headers: {'location': `${URL}/${key}`},
        body: '',
      })
    )
    .catch(err => callback(err))
}
