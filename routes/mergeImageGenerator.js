var express = require('express');
var router = express.Router();
var mergeImageGeneratorController = require('./../controllers/mergeImageGeneratorController');

router
.route('/')
  .post(mergeImageGeneratorController.generateMergeImage);

module.exports = router;