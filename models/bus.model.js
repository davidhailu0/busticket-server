const mongoose = require("mongoose")

const busSchema = new mongoose.Schema({
    busOwner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Bus Company"
    },
    plateNumber:{
        required:true,
        type:String
    },
    busBrand:{
        type:String,
        required:true
    },
    busModel:{
        type:String,
        required:true
    },
    manufacturedYear:{
        type:String,
        required:true
    },
    VIN:{
        type:String,
        required:true
    },
    driver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Employee"
    },
    features:[String],
    numberOfSeats:Number,
    unavailableSeats:{
        type:[Number],
        default:[]
    },
    busAvailable:{
        type:Boolean,
        default:true
    },
    assignedDates:[Date]
})

module.exports = mongoose.model("Bus",busSchema)