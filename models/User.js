const mongoose = require('mongoose');
const { number } = require('yargs');

const userSchema = mongoose.Schema;

const User = new userSchema({
    name: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 0
    },
    addedon:{
        type: Date,
        default: Date.now
    },
    updatedon:{
        type: Date,
        default: Date.now
    }
});

User.pre('save', function(next){
    now = new Date();
    this.updatedon = now;
    if(!this.addedon) {
        this.addedon = now
    }
    next();
});

module.exports = mongoose.model('User', User);
