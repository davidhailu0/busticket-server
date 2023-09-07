const mongoose = require("mongoose")

const Trip = new mongoose.Schema({
    bus:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Bus"
    },
    driverAssistant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Employee"
    },
    departure:{
        type:String,
        required:true
    },
    destination:{
        type:String,
        required:true
    },
    departureDate:{
        type:Date,
        required:true
    },
    reservedSeats:{
        type:[String],
        required:true,
        default:[]
    },
    bookedSeats:{
        type:[String],
        required:true,
        default:[]
    },
    departureTime:{
        type:String,
        required:true
    },
    numberOfAvailableSeats:{
        type:Number,
        required:true
    }
})

module.exports = mongoose.model("Trip",Trip)