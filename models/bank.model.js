const mongoose = require("mongoose")

const BankSchema = new mongoose.Schema({
    logo:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    accountNumber:{
        type:String,
        required:true
    },
    available:{
        type:Boolean,
        default:true
    }
})

module.exports = mongoose.model("Bank",BankSchema)