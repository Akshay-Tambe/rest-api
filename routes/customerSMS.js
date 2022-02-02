var express = require('express');
var router = express.Router();
var customerSMSController = require('./../controllers/customerSMSController');

router
.route('/')
  .post(customerSMSController.storeSMSCore);


module.exports = router;