const AWS = require('aws-sdk');
const jimp = require('jimp');
const { Validator } = require('node-input-validator');
const config = require('./../config/config.json');

const generateCardImage = async (req, res) => {
    const v = new Validator(req.body, {
        name: 'required',
        card_number: 'required'
    });

    const matched = await v.check();

    if (!matched) {
        res.status(401).json({
            status: false,
            error: v.errors
        });
        return;
    }
    const x = await jimp.read({
        url: config.gold_card_s3_url
    });

    var font = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
    x.print(font, 100, 450, req.body.name);
    
    font = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
    x.print(font, 850, 450, "Valid Thru");
    
    font = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
    x.print(font, 850, 480, req.body.valid_thru);

    font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
    x.print(font, 100, 350, req.body.card_number);

    var bufferImg;
    await x.getBuffer(jimp.MIME_PNG, (err, buffer) => {
      if(!err){
        bufferImg = buffer;
      }else{
        console.log("Error: " + err);
      }
    });

    const s3 = new AWS.S3({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region
    });
    
    const key = `${Date.now()}.png`;

    const params = {
        ACL: config.acl,
        Bucket: config.bucket,
        Key: key,
        Body: bufferImg,
        ContentType: 'image/png'
    };
    
    try {
        await s3.putObject(params).promise();
        const s3url = s3.getSignedUrl('getObject', {
            Bucket: config.bucket,
            Key: key
        });
        res.status(200).json({
            status: true,
            message: "Card generated successfully!",
            data: s3url
        });
    } catch (e) {
        res.status(401).json({
            status: false,
            error: e
        });
    }
}

module.exports = {generateCardImage}