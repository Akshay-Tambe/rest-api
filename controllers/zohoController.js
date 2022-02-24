const config = require('./../config/config.js');
const axios = require('axios');
const FormData  = require('form-data');

const zohoUrl = config.zoho.config.url;
var access_token = config.zoho.config.access_token;

exports.searchRecord = async (req, res) => {
    await fetchRefreshToken();
    let url = config.zoho.config.url + '/Contacts/search?phone=8828331738';
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
        console.log(response.data)
    })
    .catch(function (error) {
        console.log(error);
    });
}

async function fetchRefreshToken() {
    return new Promise(function (resolve, reject){
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