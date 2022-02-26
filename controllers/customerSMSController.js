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
const config = require('./../config/config.js');
var json2xls = require('json2xls');
const pdf = require('dynamic-html-pdf');
const commonController = require('./commonController');
const zohoController = require('./zohoController');

exports.storeSMSCore = async (req, res) => {
    console.log(getCurrentTime());
    var startTime = getCurrentTime();
    var calStartTime = Date.now();
    // var checkDevice = await checkDronaDevice(req.body.deviceId);
    var smslogs = req.body.smslog;
    // console.log('request', req.body);
    var smslog = [];
    smslogs.forEach(sms => {
        const event = new Date(sms.date_sent);
        var datetime = event.toISOString();
        smslog.push({origin: sms.origin, body: sms.body, date_sent:datetime})
    });
    var dataToDrona = {
        deviceId: req.body.deviceId,
        smslog: smslog
    }
    try{
        var mobile = await customerSMS.findOne({mobile: req.body.mobile});
        if(mobile === null){
            var jsonFileName = `${Date.now()}_json.json`;
            var rarFileName = `${Date.now()}_json.zip`;
            fs.writeFileSync(jsonFileName, JSON.stringify(dataToDrona));
            
            var zip = new AdmZip();
            zip.addFile(jsonFileName, fs.readFileSync(jsonFileName),'',0644);
            zip.writeZip(rarFileName);
        
            var sms = new customerSMS();
            sms.mobile = req.body.mobile;
            sms.smslog = smslogs;
            sms.deviceId = req.body.deviceId;
            await sms.save();
            
            var data = {
                deviceId: req.body.deviceId
            }
            var checkDevice = await checkDronaDevice(req.body.deviceId);
            if(checkDevice){
                // registerDeviceDrona(data);
                await pushToDrona(rarFileName, req.body.deviceId);
                fs.unlinkSync(jsonFileName);
                res.json({
                    status: true,
                    startTime: startTime,
                    endTime: getCurrentTime(),
                    executionTime: (Date.now() - calStartTime) / 1000
                })
            }else{
                await registerDeviceDrona(data);
                await pushToDrona(rarFileName, req.body.deviceId);
                fs.unlinkSync(jsonFileName);
                res.json({
                    status: true,
                    startTime: startTime,
                    endTime: getCurrentTime(),
                    executionTime: (Date.now() - calStartTime) / 1000
                })
            }
        }else{
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
        let url = config.dronaPayURL + '/device/' + deviceId;
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

function registerDeviceDrona(data){
    return new Promise(async function(resolve, reject){
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
            resolve(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });
    });
}

function pushToDrona(zipFileName, deviceId){
    return new Promise(async function(resolve, reject){
        const form_data = new FormData();
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
            resolve(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });
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
    console.log('request', req.body.deviceId);
    var deviceId = req.body.deviceId;
    var data = await fetchFromDrona(deviceId);
    var sms = await customerSMS.findOneAndUpdate({deviceId: deviceId}, { $set: {dronaData: data}});
    if(sms !== null){
        var filename = await getTransactionFromSMS(deviceId);
        zohoController.updateDronaStatement(sms.mobile, filename);
        res.json({
            status: true,
            data: filename
        })
    }else{
        // resolve(false);
        res.json({
            status: false,
            data: "There is an error"
        })
    }
}

async function fetchFromDrona(deviceId){
    return new Promise(function(resolve, reject) {
        let url = config.dronaPayURL + '/device/profile/' + deviceId;
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

function getTransactionFromSMS(deviceId){
    return new Promise(async function(resolve, reject){
        var htmlTemp = fs.readFileSync('./views/template.html', 'utf8');
        var dronaData = await customerSMS.findOne({deviceId: deviceId});
        var banks = dronaData.dronaData[0].sms_profile.bank_accounts;
        var loans = dronaData.dronaData[0].sms_profile.loans;
        var bounces = dronaData.dronaData[0].sms_profile.bounces_charges;
        var salaries = dronaData.dronaData[0].sms_profile.salary;
        var overdues = dronaData.dronaData[0].sms_profile.overdue;
        for (const bank of banks) {
            if(typeof bank.repeating_debits === 'undefined')
                bank.repeating_debits = {};
            if(typeof bank.repeating_credits === 'undefined')
                bank.repeating_credits = {};
        }
        var options = {
            format: "A4",
            orientation: "landscape",
            border: "10mm"
        };
        var document = {
            type: 'buffer',
            template: htmlTemp,
            context: {
            data: {banks, loans, bounces, overdues, salaries}
            }
        };
        var buffer = await pdf.create(document, options);
        var filename = await commonController.uploadtoBucket("Card_Documents", dronaData.mobile, 'Statement', buffer, 'application/pdf', false);
        // await insertStatementCore(dronaData.mobile, filename);
        resolve(filename);
    });
}

function insertStatementCore(mobile, filename){
    return new Promise(async function(resolve, reject){
        let url = config.core.config.url + "api/customer/drona/data";
        let data = {
            mobile: mobile,
            url: filename
        }
        var configData = {
            method: 'post',
            url: url,
            data: data
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
    });
}