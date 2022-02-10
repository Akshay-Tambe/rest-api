const mongoose = require('mongoose');
const smsSchema = mongoose.Schema;

const customerSMS = new smsSchema({
    mobile: {
        type: Number,
        required: true
    },
    deviceId: {
        type: String,
        required: true
    },
    smslog: [{
        date_sent: {
            type: Date,
            required: true
        },
        body: {
            type: String,
            required: true
        },
        origin: {
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
