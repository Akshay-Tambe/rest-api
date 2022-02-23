const customerSMS = require('./../models/customerSMS');
const fs = require('fs');
const compressing = require('compressing');
const axios = require('axios');
const FormData  = require('form-data');
const multer = require("multer");
const AdmZip = require("adm-zip");
const multiparty = require('multiparty');
const path = require("path");
const JSZip = require('jszip');
const buffer = require("buffer");

exports.storeSMSCore = async (req, res) => {
    console.log(getCurrentTime());
    var startTime = getCurrentTime();
    var calStartTime = Date.now();
    // var checkDevice = await checkDronaDevice(req.body.deviceId);
    var smslogs = req.body.smslog;
    // console.log('request', req.body);
    // var smslog = [];
    // smslogs.forEach(sms => {
    //     const event = new Date(sms.date_sent);
    //     var datetime = event.toISOString();
    //     smslog.push({origin: sms.origin, body: sms.body, date_sent:datetime})
    // });
    // var dataToDrona = {
    //     deviceId: req.body.deviceId,
    //     smslog: smslog
    // }
    try{
        // var jsonFileName = `${Date.now()}_json.json`;
        // var rarFileName = `${Date.now()}_json.zip`;
        // fs.writeFileSync(jsonFileName, JSON.stringify(dataToDrona));
        
        // var zip = new AdmZip();
        // zip.addFile(jsonFileName, fs.readFileSync(jsonFileName),'',0644);
        // zip.writeZip(rarFileName);
        
        
        var mobile = await customerSMS.findOne({mobile: req.body.mobile});
        if(mobile === null){
            var sms = new customerSMS();
            sms.mobile = req.body.mobile;
            sms.smslog = smslogs;
            sms.deviceId = req.body.deviceId;
            await sms.save();
            
            res.json({
                status: true,
                startTime: startTime,
                endTime: getCurrentTime(),
                executionTime: (Date.now() - calStartTime) / 1000
            })

            // var data = {
            //     deviceId: req.body.deviceId
            // }
            // var checkDevice = await checkDronaDevice(req.body.deviceId);
            // if(checkDevice){
            //     registerDeviceDrona(data);
            //     pushToDrona(rarFileName, req.body.deviceId);
            //     fs.unlinkSync(jsonFileName);
            //     await fetchDronaData(req.body.deviceId);
            //     res.json({
            //         status: true,
            //         startTime: startTime,
            //         endTime: getCurrentTime(),
            //         executionTime: (Date.now() - calStartTime) / 1000
            //     })
            // }else{
            //     pushToDrona(rarFileName, req.body.deviceId);
            //     fs.unlinkSync(jsonFileName);
            //     await fetchDronaData(req.body.deviceId);
            //     res.json({
            //         status: true,
            //         startTime: startTime,
            //         endTime: getCurrentTime(),
            //         executionTime: (Date.now() - calStartTime) / 1000
            //     })
            // }
        }else{
            // var sms = await customerSMS.findOneAndUpdate({mobile: req.body.mobile}, { $push: {smslog: smslogs}});
            // pushToDrona(rarFileName, req.body.deviceId);
            // fs.unlinkSync(jsonFileName);
            // await fetchDronaData(req.body.deviceId);
            res.json({
                status: true,
                startTime: startTime,
                endTime: getCurrentTime(),
                executionTime: (Date.now() - calStartTime) / 1000
            })
        }
    }catch(e){
        res.json({
            status: false,
            data: e
        })
    }
}

exports.storeSMSCoreZIP = async (req, res) => {
    console.log(getCurrentTime());
    var startTime = getCurrentTime();
    var calStartTime = Date.now();
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
            var data = {
                deviceId: fields.deviceId[0]
            }
            registerDeviceDrona(data);
            pushToDrona(filename, fields.deviceId[0]);
            fs.unlinkSync(outputDir + '/sms.json');
            res.json({
                status: true,
                startTime: startTime,
                endTime: getCurrentTime(),
                executionTime: (Date.now() - calStartTime) / 1000
            })
        } catch (e) {
            console.log(`Something went wrong. ${e}`);
        }
    });
}

function checkDronaDevice(deviceId) {
    return new Promise(async function(resolve, reject) {
        let url = process.env.dronaPayURL + '/device/' + deviceId;
        var configData = {
            method: 'get',
            url: url
        };
        console.log(configData);
        axios(configData)
        .then(function (response) {
            console.log(response);
            resolve(true)
        })
        .catch(function (error) {
            console.log(error);
            resolve(false)
        });
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

async function registerDeviceDrona(data){
    
    let url = process.env.dronaPayURL + '/device/register';
    var configData = {
        method: 'post',
        url: url,
        data : data
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

async function pushToDrona(zipFileName, deviceId){
    const form_data = new FormData();
    // form_data.append("deviceId", deviceId);
    form_data.append("file", fs.createReadStream(zipFileName));
    let url = process.env.dronaPayURL + '/device/file/' + deviceId;
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
        fs.unlinkSync(zipFileName);
    })
    .catch(function (error) {
        console.log(error);
    });
}

function getCurrentTime(){
    let date_ob = new Date();

    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = date_ob.getHours();

    // current minutes
    let minutes = date_ob.getMinutes();

    // current seconds
    let seconds = date_ob.getSeconds();

    // current seconds
    let miliseconds = date_ob.getMilliseconds();

    // prints date in YYYY-MM-DD format
    console.log(year + "-" + month + "-" + date);

    // prints date & time in YYYY-MM-DD HH:MM:SS format
    var currentTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + ":" + miliseconds;
    return currentTime;
}

exports.fetchDronaData = async (req, res) => {
// function fetchDronaData(deviceId){

    // return new Promise(async function(resolve, reject) {
    //     var deviceId = req.params.deviceId;
    //     var data = await fetchFromDrona(deviceId);
    //     var sms = await customerSMS.findOneAndUpdate({deviceId: deviceId}, { $set: {dronaData: data}});
    //     if(sms !== null){
    //         resolve(true);
    //     }else{
    //         resolve(false);
    //     }
    // })

    var deviceId = req.params.deviceId;
    var data = await fetchFromDrona(deviceId);
    var sms = await customerSMS.findOneAndUpdate({deviceId: deviceId}, { $set: {dronaData: data}});
    if(sms !== null){
        // resolve(true);
        res.json({
            status: true,
            data: "Data fetch successfully!"
        })
    }else{
        // resolve(false);
        res.json({
            status: false,
            data: "There is an error"
        })
    }
}

function fetchFromDrona(deviceId){
    return new Promise(async function(resolve, reject) {
        let url = process.env.dronaPayURL + '/device/profile/' + deviceId;
        var configData = {
            method: 'get',
            url: url
        };
        console.log(configData);
        axios(configData)
        .then(function (response) {
            console.log(response.data);
            resolve(response.data)
        })
        .catch(function (error) {
            console.log(error);
            reject(error)
        });
    })
}

exports.fetchSMS = async (req, res) => {
    var sms = await customerSMS.findOne({mobile: req.params.mobile});
    if(sms){
        res.json({
            status: true,
            data: sms
        })
    }else{
        res.json({
            status: false,
            data: "No data found"
        })
    }
}

exports.getTransactionFromSMS = async (req, res) => {

}