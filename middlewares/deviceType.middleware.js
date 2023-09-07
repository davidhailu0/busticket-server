const Device = require("../models/device.model")

const getDeviceType = async(req,res,next)=>{
    let device = await Device.findOne({})
    if(!device){
        device = new Device()
    }
    switch(req.device.type.toLowerCase()){
        case "desktop":
            device.desktop += 1
            break;
        case "mobile":
            device.mobile += 1
        default:
            device.mobile += 1
    }
    await device.save()
    next()
}

module.exports = getDeviceType