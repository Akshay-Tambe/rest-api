const customerSMS = require('./../models/customerSMS');

exports.storeSMS = async (req, res) => {
    try{
        var sms = await customerSMS.findOne({mobile: req.body.mobile});
        if(sms === null){
            sms = new customerSMS();
            sms.mobile = req.body.mobile;
            sms.smsData = req.body.smsData;
            await sms.save();
            res.json({
                status: true,
                data: "SMS stored successfully"
            })
        }else{
            await customerSMS.findByIdAndUpdate(sms._id, {$push: {smsData: req.body.smsData}});
            res.json({
                status: true,
                data: "SMS stored successfully"
            })
        }
    }catch(e){
        res.json({
            status: false,
            data: e
        })
    }
}