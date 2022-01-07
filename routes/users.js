var express = require('express');
var router = express.Router();
const userController = require('./../controllers/UserController')

/* GET users listing. */
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);

module.exports = router;
