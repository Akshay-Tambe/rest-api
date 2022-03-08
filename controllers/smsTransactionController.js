const customerSMS = require('./../models/customerSMS');

exports.setSummary = async (req, res) => {
    var bankingSMS = [];
    var sms = await customerSMS.findOne({mobile: req.params.mobile});
    var sms = sms.smslog;
    for (const row of sms) {
        bankingSMS.push(row.body)
    }
    res.json({
        data: sms
    })
}