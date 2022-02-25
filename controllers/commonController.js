const AWS = require('aws-sdk');
const config = require('./../config/config.js');

exports.uploadtoBucket = (mydest, folder, name, file, type, base64) => {
    return new Promise(async function(resolve, reject) {
      var filedata = "";
      switch (type) {
        case 'image/png':
          type = 'png';
          break;
        case 'image/gif':
          type = 'gif';
          break;
        case 'image/jpeg':
          type = 'jpg';
          break;
        case 'application/pdf':
          type = 'pdf';
          break;
        default:
          type = 'jpg';
      }
      //console.log("fullname", fullname, config.aws.s3);
      if (base64) {
        filedata = new Buffer.from(file.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      } else {
        filedata = file;
      }
      //var type = await commonControl.getBufferExtension(filedata);
      const BUCKETS_NAME = config.aws.bucket;
      const BUCKET_NAME = `${BUCKETS_NAME}/${mydest}/${folder}`;
      const params = {
        Bucket: BUCKET_NAME,
        Key: new Date().getTime() + '_' + name + '.' + type, // File name you want to save as in S3
        Body: filedata,
        ContentEncoding: base64 ? 'base64' : 'none',
      };
      var filename = await uploadtoS3(BUCKET_NAME, params);
      //var filename = name;
      console.log(filename);
      resolve(filename);
  
    });
}

function uploadtoS3(mydest, params) {
    return new Promise(async function(resolve, reject) {
      var s3 = new AWS.S3(config.aws.s3);
      s3.upload(params, function(err, data) {
        if (err) {
          reject(err);
        } else {
          var finalpath = data.Location;
          console.log("finalpath", finalpath);
          resolve(finalpath);
        }
      });
    })
  }