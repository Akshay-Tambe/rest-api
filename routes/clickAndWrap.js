var express = require('express');
var router = express.Router();
var clickAndWrapController = require('./../controllers/clickAndWrapController');

router
.route('/getHTML')
  .get(clickAndWrapController.getHTML);

module.exports = router;