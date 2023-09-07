const mongoose = require("mongoose")

const CallSchema = new mongoose.Schema({
    calls:{
        required:true,
        type:Number
    },
    date:{
        required:true,
        type:Date
    }
})

module.exports = CallSchema