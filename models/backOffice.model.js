const mongoose = require("mongoose")

const BackOfficeSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:"ADMIN"
    },
    active:{
        type:Boolean,
        default:true
    }
})
module.exports = mongoose.model("BackOffice",BackOfficeSchema)