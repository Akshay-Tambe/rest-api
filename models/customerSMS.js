const mongoose = require('mongoose');
const smsSchema = mongoose.Schema;

const customerSMS = new smsSchema({
    mobile: {
        type: Number,
        required: true
    },
    smsData: [{
        dateOfSMS: {
            type: Date,
            required: true
        },
        sms: {
            type: String,
            required: true
        },
        senderId: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('customerSMS', customerSMS);
