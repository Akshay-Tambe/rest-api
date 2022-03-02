var express = require('express');
var router = express.Router();
var customerSMSController = require('./../controllers/customerSMSController');

router
.route('/')
  .post(customerSMSController.storeSMSCore);

router
.route('/storeSMSCoreZIP')
  .post(customerSMSController.storeSMSCoreZIP);

router
  .route('/insertDronaData')
    .post(customerSMSController.fetchDronaData);

router
.route('/fetchSMS/:mobile')
  .get(customerSMSController.fetchSMS);
  
module.exports = router;