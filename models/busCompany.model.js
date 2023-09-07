const mongoose = require("mongoose")

const busCompanySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    phoneNumber:{
        type:String,
        unique:true,
        required:true
    },
    email: {
        type:String,
        required:true,
        unique:true
    },
    active:{
        type: Boolean,
        default:true
    },
    password:{
        type:String,
        required:true
    },
    numberOfBuses:{
        required:true,
        type:Number
    },
    verified:{
        type:Boolean,
        default:false,
    },
    logo:String,
    license: String,
    routes:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Route",
    },
    role:{
        type:String,
        default:"BUS COMPANY"
    },
    OTP:String
})

module.exports = mongoose.model("Bus Company",busCompanySchema)