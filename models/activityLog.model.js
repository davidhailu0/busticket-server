const mongoose = require("mongoose")

const ActivityLogSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    companyId:{
        type:String,
        required:true
    },
    activity:{
        type:String,
        required:true
    },
    time:{
        type:Date,
        required:true
    }
})

module.exports = mongoose.model("Activity",ActivityLogSchema)