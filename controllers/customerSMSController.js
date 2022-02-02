const customerSMS = require('./../models/customerSMS');
const fs = require('fs');
const compressing = require('compressing');
const axios = require('axios');
const FormData  = require('form-data');

exports.storeSMSCore = async (req, res) => {
    try{
        sms = new customerSMS();
        sms.mobile = req.body.mobile;
        sms.smsData = req.body.smsData;
        await sms.save();
        res.json({
            status: true
        })
    }catch(e){
        res.json({
            status: false,
            data: e
        })
    }
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