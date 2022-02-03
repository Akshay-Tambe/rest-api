const customerSMS = require('./../models/customerSMS');
const fs = require('fs');
const compressing = require('compressing');
const axios = require('axios');
const FormData  = require('form-data');
const multer = require("multer");
const AdmZip = require("adm-zip");
const multiparty = require('multiparty');
const path = require("path");

exports.storeSMSCore = async (req, res) => {
    var startTime = Date.now();
    try{
        sms = new customerSMS();
        sms.mobile = req.body.mobile;
        sms.smsData = req.body.smsData;
        await sms.save();
        res.json({
            status: true,
            executionTime: (Date.now() - startTime) / 1000
        })
    }catch(e){
        res.json({
            status: false,
            data: e
        })
    }
}

exports.storeSMSCoreZIP = async (req, res) => {
    var startTime = Date.now();
    var filedata, filename, filetype;
    var path = './';
    var form = new multiparty.Form({uploadDir: path});
    form.parse(req, async function(err, fields, files) {
        var file = files.file;
        filetype = file[0].headers['content-type'];
        filedata = await readfile(file[0].path);
        filename = file[0].path;
        console.log(fields.mobile);
        try {
            const zip = new AdmZip(filename);
            const outputDir = `_extracted`;
            zip.extractAllTo(outputDir);
            var data = fs.readFileSync(outputDir + '/sms.json');
            var dataJson = JSON.parse(data.toString());
            sms = new customerSMS();
            sms.mobile = fields.mobile[0];
            sms.smsData = dataJson;
            await sms.save();
            fs.unlinkSync(filename);
            fs.unlinkSync(outputDir + '/sms.json');
            res.json({
                status: true,
                executionTime: (Date.now() - startTime) / 1000
            })
        } catch (e) {
            console.log(`Something went wrong. ${e}`);
        }
    });
}

exports.pushToDrona = async (req, res) => {
    res.json({
        status: true
    })
}

function readfile(file) {
    return new Promise(async function(resolve, reject) {
      fs.readFile(file, (err, filedata) => {
        if (err) {
          reject(err);
        } else {
          resolve(filedata);
        }
      })
    })
  }

function registerDeviceDrona(data){
    var status;
    let url = process.env.dronaPayURL + '/device/register';
    var configData = {
        method: 'post',
        url: url,
        data : data
    };
    console.log(configData);
    axios(configData)
    .then(function (response) {
        console.log(response.status);
    })
    .catch(function (error) {
        console.log(error);
    });
}

async function pushToDrona(zipFileName, deviceId){
    const form_data = new FormData();
    form_data.append("deviceId", deviceId);
    form_data.append("file", fs.createReadStream(zipFileName));
    let url = process.env.dronaPayURL + '/device/file';
    var configData = {
        method: 'post',
        url: url,
        data : form_data,
        headers: {
            "Content-Type": "multipart/form-data; boundary=" + form_data.getBoundary()
        },
    };
    console.log(configData);
    axios(configData)
    .then(function (response) {
        console.log(response.data);
    })
    .catch(function (error) {
        console.log(error);
    });
}

// try{
//     var fileName = `./myjsonfile${Date.now()}.json`;
//     var zipFileName = `./myzipfile${Date.now()}.zip`;
//     var sms = await customerSMS.findOne({mobile: req.body.mobile});
//     if(sms === null){
//         sms = new customerSMS();
//         sms.mobile = req.body.mobile;
//         sms.smsData = req.body.smsData;
//         await sms.save();
        
//         fs.writeFileSync(fileName, JSON.stringify(req.body.smsData));
//         await compressing.gzip.compressFile(fileName, zipFileName);
//         var deviceId = `device_${Date.now()}`;
//         var data = {
//             "deviceId" : deviceId
//         }
//         registerDeviceDrona(data);
//         pushToDrona(zipFileName, deviceId);
//         res.json({
//             status: true
//         })
//     }else{
//         await customerSMS.findByIdAndUpdate(sms._id, {$push: {smsData: req.body.smsData}});
//     }  
// }catch(e){
//     res.json({
//         status: false,
//         data: e
//     })
// }