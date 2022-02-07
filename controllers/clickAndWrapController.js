var pdf  = require('dynamic-html-pdf');
var fs = require('fs');
const config = require('./../config/config.js');
const AWS = require('aws-sdk');
var html = fs.readFileSync('./views/template.html', 'utf8');

exports.getHTML = async (req, res) => {
    var data = {
        deviceId : "3ba81bbb53b1c393",
        ip : "223.229.131.106",
        cutsomerName : "Krutika Sangale",
        currentTime: Date.now()
    }
    var options = {
        format: "A4",
        orientation: "portrait",
        border: "20mm"
    };
    var document = {
        type: 'buffer',    
        template: html,
        context: {
            data: data
        }
    };
    console.log(document);
    var buffer = await pdf.create(document, options);
    const s3 = new AWS.S3({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region
    });
    
    const key = `${Date.now()}.pdf`;

    const params = {
        ACL: config.acl,
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf'
    };
    
    try {
        await s3.putObject(params).promise();
        const s3url = s3.getSignedUrl('getObject', {
            Bucket: config.bucket,
            Key: key
        });
        res.status(200).json({
            status: true,
            message: "PDF generated successfully!",
            data: s3url
        });
    } catch (e) {
        res.status(401).json({
            status: false,
            error: e
        });
    }
}