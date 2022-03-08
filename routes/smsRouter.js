var express = require('express');
var router = express.Router();
var smsTransactionController = require('./../controllers/smsTransactionController');

router
.route('/getSummary/:mobile')
  .get(smsTransactionController.setSummary);

module.exports = router;