const env = require('dotenv').config();

module.exports = {
    "accessKeyId": process.env.ACCESSKEYID,
    "secretAccessKey": process.env.SECRETACCESSKEY,
    "region": "ap-south-1",
    "bucket" : "card-aki",
    "acl" : "public-read",
    "gold_card_s3_url" : "https://card-aki.s3.ap-south-1.amazonaws.com/gold.png",
    "dronaPayURL" : process.env.dronaPayURL,

    zoho: {
        config: {
            url: process.env.ZOHO_URL,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            refresh_token: process.env.ZOHO_REFRESH_TOKEN,
            access_token: process.env.ZOHO_ACCESS_TOKEN
        }
    },
    aws: {
        s3: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        },
        bucket: process.env.S3_BUCKET
    }
}