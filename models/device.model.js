const mongoose = require("mongoose")

const DeviceShema = new mongoose.Schema({
    desktop:{
        type:Number,
        default:0
    },
    mobile:{
        type:Number,
        default:0
    }
})

module.exports = mongoose.model("Device",DeviceShema)