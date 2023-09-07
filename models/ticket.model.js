const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    ticketPurchaser:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    passengerId:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    bus:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Bus"
    },
    pickupLocation:{
        type: String
    },
    departure:{
        type:String,
        required:true
    },
    destination:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    time:{
        type:String,
        required:true,
        default:"4:00 AM"
    },
    status:{
        type:String,
        default:"RESERVED"
    },
    price:Number,
    referenceID:{
        type:String,
        required:true
    },
    reservedSeat:{
        type:String,
        required:true
    },
    bookedBy:String,
    bankName:String,
    bankAccount:String,
    reservedBy:String,
    reservedAt:Date,
    bookedAt:Date,
    expiredAt:Date,
    completedAt:Date,
    cancelledAt:Date,
    terminatedBy:String,
    terminatedAt: Date,
    userNotified:{
        type:Boolean,
        default:false
    }
})
module.exports = mongoose.model("Ticket",ticketSchema)
