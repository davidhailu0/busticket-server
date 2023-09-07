const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
    },
    password:String,
    phoneNumber:{
        type:String,
        required:true
    },
    active:{
        type: Boolean,
        default:true
    },
    role:{
        type:String,
        default:"PASSENGER"
    },
    StillLooking:Boolean,
    departure:String,
    destination:String,
    tripDate:Date,
    OTP:String
})

module.exports = mongoose.model("User",userSchema)