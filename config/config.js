const env = require('dotenv').config();

module.exports = {
    "accessKeyId": process.env.ACCESSKEYID,
    "secretAccessKey": process.env.SECRETACCESSKEY,
    "region": "ap-south-1",
    "bucket" : "card-aki",
    "acl" : "public-read",
    "gold_card_s3_url" : "https://card-aki.s3.ap-south-1.amazonaws.com/gold.png" 
}