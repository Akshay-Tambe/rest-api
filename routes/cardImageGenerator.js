var express = require('express');
var router = express.Router();
var cardImageGeneratorController = require('./../controllers/cardImageGeneratorController');

router
.route('/')
  .post(cardImageGeneratorController.generateCardImage);

module.exports = router;