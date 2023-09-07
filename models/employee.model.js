const mongoose = require("mongoose")

const EmployeeSchema = new mongoose.Schema({
    name:{
        required:true,
        type:String
    },
    phoneNumber:{
        required:true,
        type:[String]
    },
    busCompany:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Bus Company"
    },
    address:{
        required:true,
        type:String
    },
    role:{
        type:String,
        required:true,
    },
    password:String,
    emergencyContactName:String,
    emergencyContactPhone:String,
    suretyName:{
        type:String,
        required:true
    },
    suretyPhone:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    languages:{
        type:[String]
    },
    assignedTo:mongoose.Schema.Types.ObjectId,
    licenseType:String,
    licenseID:String,
    licenseExpiryDate:Date,
    licensePhoto:String,
    assignedDates:[Date],
    OTP:String
})

module.exports = mongoose.model("Employee",EmployeeSchema)