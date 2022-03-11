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
const config = require('../config/config');
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
    var smsArray = [];
    var smslog = [];
    var lastSixMonths = await getlastSixMonths();
    var i = 0;
    for (const smslog of smslogs) {
        const event = new Date(smslog.date_sent);
        var date = event.toISOString().slice(0,7);
        var found = lastSixMonths.find(month => month == date);
        if(found != null){
            smsArray.push(smslog);
        }
    }
    smsArray.forEach(sms => {
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
            sms.smslog = smsArray;
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

function getlastSixMonths(){
    return new Promise(async function(resolve, reject){
        var lastMonths = [];
        for (let index = 1; index <= 6; index++) {
            var d = new Date();
            d.setMonth(d.getMonth() - index);
            var month = d.toISOString();
            lastMonths.push(month.slice(0, 7));
        }
        console.log(lastMonths);
        resolve(lastMonths);
    })
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
    var sms = await customerSMS.findOne({deviceId: deviceId});
    var data = await fetchFromDrona(deviceId);
    var bounces = getBounces(data.sms_profile.bounces_charges);
    var salary = getSalary(data.sms_profile.salary);
    var EMIs = getEMIs(data.sms_profile.loans);
    var avgBalance = getAvgBalance(data.sms_profile.bank_accounts);
    var overdues = getOverdues(data.sms_profile.overdue);
    var credit_cards = getCC(data.sms_profile.cards);
    // var utitlities = getUtilities(data.sms_profile.utilities);
    console.log(credit_cards);
        var bank_details = await insertDronaTrans(deviceId);
        var bankingData = {
            bounces: bounces.toString(),
            salary: salary,
            EMIs : EMIs,
            avgBalance: avgBalance,
            overdues: overdues,
            cc : credit_cards
        }
        var buffer = await htmlToPdf(bank_details, bankingData);
        // var path = `./pdf/${Date.now()}.pdf`;
        // await fs.createWriteStream(path).write(buffer);
        // var filename = await getTransactionFromSMS(deviceId);
        var filename = await commonController.uploadtoBucket("Card_Documents", sms.mobile, 'Statement', buffer, 'application/pdf', false);
        zohoController.updateDronaStatement(sms.mobile, filename);
        // // zohoController.updateDronaSummery(sms.mobile, bankingData);
        await insertStatementCore(sms.mobile, filename);
        res.json({
            status: true,
            data: bankingData
        })
    
}

function getCC(data){
    var cc = [];
    if(data.length>0){
        for (const card of data) {
            if(card.type == 'Credit')
                if(card.available_limit_or_balance !== undefined)
                    cc.push({bank: card.bank, limit: card.available_limit_or_balance})
                else
                    cc.push({bank: card.bank, limit: 'Not detected'})
        }
    }
    return cc;
}

function getOverdues(data){
    var overdues = {};
    
    if(data.length > 0){
        for (const overdue of data) {
            if(overdue.count > 0){
                var obj = [];
                for (const detail of overdue.details) {
                    if(detail.utility !== undefined)
                        obj.push({amount : detail.due_amount, utility : detail.utility});
                    else
                        obj.push({amount : detail.due_amount, utility : 'card'});
                }
                overdues[overdue.month] = obj;
            }
        }
    }
    return overdues;
}

function getAvgBalance(data){
    var banks = {};
    if(data.length > 0){
        for (const bank_account of data) {
            var avgB = 0;
            var i = 0;
            var obj;
            if(Object.keys(bank_account.avg_balances).length>0){
                for (const key in bank_account.avg_balances) {
                    if(bank_account.avg_balances[key] != "")
                        avgB += parseInt(bank_account.avg_balances[key]);
                    i++;
                }
                obj = parseInt(avgB/i);
            }else{
                obj = 'Not detected';
            }
            if(bank_account.repeating_credits.length>0){
                for (const rc of bank_account.repeating_credits) {
                    if(rc.count === 0){
                        rc.details = [{amount: "0.00", info: "Data not found"}];
                    }
                }
            }
            if(bank_account.repeating_debits.length>0){
                for (const rc of bank_account.repeating_debits) {
                    if(rc.count === 0){
                        rc.details = [{amount: "0.00", info: "Data not found"}];
                    }
                }
            }
            banks[`${bank_account.bank}-${bank_account.account}`] = {'avg_bal' : obj, 'recurring_credits' : bank_account.repeating_credits, 'repeating_debits' : bank_account.repeating_debits};
        }
    }
    return banks;
}
function getBounces(data){
    var count = 0;
    if(data.length>0){
        for (const bounces of data) {
            count += bounces.count;
        }
    }
    return count;
}

function getEMIs(data){
    var emi = 0;
    if(data.length>0){
        for (const loans of data) {
            var e = 0;
            for (const loan of loans.emis) {
                if(loan.count>0){
                    e = parseInt(loan.details[0].amount);
                }
            }
            emi += e;
        }
    }else{
        emi = "Not detected"
    }
    return emi;
}

function getSalary(data){
    var count = 0;
    var salary = 0;
    if(data.length>0){
        for (const salaries of data) {
            salary = salary + parseInt(salaries.amount);
            count++;
        }
        return parseInt(salary/count);
    }else{
        return "Not detected";
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

exports.fetchTransactionDrona = async (req, res) => {
    var deviceId = req.params.deviceId;
    var transactions = await fetchTransactionDrona(deviceId);
    var accounts = getAccountNumbers(transactions);
    res.json({
        status: true,
        accounts: accounts
    })
}

function getAccountNumbers(transactions){
    var accounts = [];
    for (const transaction of transactions) {
        accounts.push(transaction.account);
    }
    var accountArray = accounts.filter((value, index, accountArray) => accountArray.indexOf(value) === index);
}

function fetchTransactionDrona(deviceId){
    return new Promise(async (resolve, reject) => {
        let url = config.dronaPayURL + '/device/transactions/' + deviceId;
        var configData = {
            method: 'get',
            url: url,
        };
        console.log(configData);
        axios(configData)
        .then(function (response) {
            console.log(response.data);
            resolve(response.data)
        })
        .catch(function (error) {
            console.log(error.data);
            reject(error)
        });
    })
}

function insertDronaTrans(deviceId) {
    return new Promise(async function(resolve, reject){
        var dronaTran = await getDronaTrans(deviceId);
        var bank_details = await organizeSms(dronaTran);
        // var buffer = await htmlToPdf(bank_details);
        resolve(bank_details);
    })
}

function getDronaTrans(deviceId){
    return new Promise(async function(resolve, reject){
        var configData = {
            method: 'get',
            url: `${config.dronaPayURL}/device/transactions/${deviceId}`,
        }
        console.log(configData)
        axios(configData).
        then(function(response){
            console.log(response.data);
            resolve(response.data);
        }).catch(function(error){
            console.log(error.data)}); 
    });
}

function organizeSms(smsDump) {
    return new Promise(async function(resolve, reject){
        var keys = [];
        for (i=0; i<smsDump.length; i++){
            // console.log(smsDump[i].origin);
            var bankname = smsDump[i].origin
            let bankString = bankname.slice(2,9);
            keys.push(bankString);
        }
        let uniqueKeys = keys.filter((v, i, a) => a.indexOf(v) === i);
        var bank_details = {};
        for (i =0; i < uniqueKeys.length; i++){
            var filterVal = uniqueKeys[i];
            var organizedDetails=[];
            for(j=0; j < smsDump.length; j++){
                if (smsDump[j].origin.slice(2,9) == filterVal){
                    if(smsDump[j].pos_credit === true){
                        smsDump[j]['credit'] = smsDump[j].amount;
                        smsDump[j]['debit'] = "0.00"
                    }
                    if(smsDump[j].pos_debit === true){
                        smsDump[j]['debit'] = smsDump[j].amount;
                        smsDump[j]['credit'] = "0.00"
                    }
                    smsDump[j]['date'] = smsDump[j].date_sent.toString().slice(0, 10);
                    organizedDetails.push(smsDump[j]);
                }
            }
            bank_details[uniqueKeys[i]] = organizedDetails.sort((a,b)=> (a.date < b.date ? 1 : -1));
        }
        resolve(bank_details);
    })
    
}

function htmlToPdf(bank_details, bankingData){
    return new Promise(async function(resolve, reject){
        isData = false;
        if(Object.keys(bank_details).length > 0){
            isData = true
        }
        var options = {
            format: "A4",
            orientation: "landscape",
            border: "10mm"
        };
        var htmlDoc = fs.readFileSync('./views/dronaStatement.html', 'utf8')
        var document = {
          type: 'buffer',
          template: htmlDoc,
          context: {
            data: {bank_details, bankingData}
          }
        };
        pdf.registerHelper("inc", function(value, options)
        {
            return parseInt(value) + 1;
        });
        var contents = await pdf.create(document, options);
        resolve(contents);
    })   
}