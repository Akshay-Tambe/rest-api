const Jimp = require('jimp');
const AWS = require('aws-sdk');
const { Validator } = require('node-input-validator');

const generateMergeImage = async (req, res) => {
    const v = new Validator(req.body, {
        selfie_url: 'required',
        aadhaar_pic_url: 'required'
    });

    const matched = await v.check();

    if (!matched) {
        res.status(401).json({
            status: false,
            error: v.errors
        });
        return;
    }

    let img1 = await Jimp.read({
        url: req.body.selfie_url
    });
    img1 = img1.resize(300,300);
    let img2 = await Jimp.read({
        url: req.body.aadhaar_pic_url
    });
    img2 = img2.resize(300,300);

    let mergeImg = new Jimp(620, 300, 'white', (err, image) => {
        if(err){
            console.log(err);
        }
    });

    mergeImg.composite(img1, 0, 0);
    mergeImg.composite(img2, 320, 0);
    
    var bufferImg;

    await mergeImg.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
      if(!err){
        bufferImg = buffer;
      }else{
        console.log("Error: " + err);
      }
    });

    const s3 = new AWS.S3({
        accessKeyId: 'AKIA4IF2K677FSX3NPLL',
        secretAccessKey: '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',
        region: 'ap-south-1'
    });

    const key = `${Date.now()}.png`;

    const params = {
        ACL: "public-read",
        Bucket: "card-aki",
        Key: key,
        Body: bufferImg,
        ContentType: 'image/png'
    };
    
    try {
        await s3.putObject(params).promise();
        const s3url = s3.getSignedUrl('getObject', {
            Bucket: "card-aki",
            Key: key
        });
        res.status(200).json({
            status: true,
            message: "Merged image generated successfully!",
            data: s3url
        });
    } catch (e) {
        res.status(401).json({
            status: false,
            error: e
        });
    }
}

module.exports = {generateMergeImage}