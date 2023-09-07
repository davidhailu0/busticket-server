const mongoose = require("mongoose")
const Call = require("./call.model")

const CallCenterSchema = new mongoose.Schema({
    name:{
        required:true,
        type:String
    },
    phoneNumber:{
        required:true,
        type:String
    },
    password:{
        required:true,
        type:String
    },
    calls:{
        required:true,
        type:[Call]
    },
    status:{
        type:Boolean,
        default:true
    },
    role:{
        type:String,
        default:"CALL OPERATOR"
    },
    OTP:String
})

module.exports = mongoose.model("Call Center",CallCenterSchema)