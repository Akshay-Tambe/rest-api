const User = require('./../models/User');

const getAllUsers = async (req, res) => {
    const users = await User.find();
    res.status(200).json({
        status: true,
        result: users.length,
        users: users
    });
}

const createUser = async (req, res) => {
    const user = await User.create(req.body);
    res.status(200).json({
        status: true,
        user: user
    });
}

const getUser = async (req, res) => {
    console.log(req.params);
    const user = await User.findById(req.params.id);
    res.status(200).json({
        status: true,
        user: user
    });
}

const updateUser = async (req, res) => {
    console.log(req.body);
    const user = await User.findOneAndUpdate(req.params.id, req.body);
    res.status(200).json({
        status: true,
        message: "Updated successfully"
    });
}

const deleteUser = async (req, res) => {
    console.log(req.body);
    const user = await User.findOneAndDelete(req.params.id);
    res.status(200).json({
        status: true,
        message: "Deleted successfully"
    });
}

module.exports = {getAllUsers, createUser, getUser, updateUser, deleteUser};