const config = require('./../config/config.js');
const axios = require('axios');
const FormData  = require('form-data');

const zohoUrl = config.zoho.config.url;
var access_token = config.zoho.config.access_token;

exports.updateDronaStatement = async (mobile, filename) => {
    var recordId = await searchRecord(mobile);
    // console.log('recordId', recordId);
    await updateDronaStatement(recordId, filename);
}

async function updateDronaStatement(recordId, filename){
    var data = {
        data: [{
            Bank_Stat_URL: filename,
            Bank_Statement: true
        }]
      }
    await pushToCRM(recordId, data);
}

function pushToCRM(recordId, data){
    return new Promise(async function(resolve, reject){
        let url = config.zoho.config.url + '/Contacts/' + recordId;
        let headers = {
            Authorization: `Zoho-oauthtoken ${access_token}`
        }
        var configData = {
            method: 'get',
            url: url,
            headers: headers,
            data: data
        };
        
        console.log(configData);
        axios(configData)
        .then(function (response) {
            console.log(response.data)
        })
        .catch(function (error) {
            console.log(error);
        });
    });
}

function searchRecord(phone){
    return new Promise(async function (resolve, reject){
        await fetchRefreshToken();
        let url = config.zoho.config.url + '/Contacts/search?phone=' + phone;
        let headers = {
            Authorization: `Zoho-oauthtoken ${access_token}`
        }
        var configData = {
            method: 'get',
            url: url,
            headers: headers
        };
        
        console.log(configData);
        axios(configData)
        .then(function (response) {
            console.log(response.data.data[0].id)
            resolve(response.data.data[0].id);
        })
        .catch(function (error) {
            console.log(error);
        });
    });
}

function fetchRefreshToken() {
    return new Promise(async function (resolve, reject){
        let url = 'https://accounts.zoho.in/oauth/v2/token';
        var data = new FormData();
        data.append('client_id', `${config.zoho.config.client_id}`);
        data.append('client_secret', `${config.zoho.config.client_secret}`);
        data.append('refresh_token', `${config.zoho.config.refresh_token}`);
        data.append('grant_type', 'refresh_token');
        var configData = {
            method: 'post',
            url: url,
            headers: {
                ...data.getHeaders()
            },
            data: data
        };
        console.log(configData);
        axios(configData)
        .then(function (response) {
            access_token = response.data.access_token
            resolve(true)
        })
        .catch(function (error) {
            console.log(error);
        });
    });
}