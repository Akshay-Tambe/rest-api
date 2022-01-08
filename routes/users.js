var express = require('express');
var router = express.Router();
const userController = require('./../controllers/UserController')

/* GET users listing. */
router
.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
