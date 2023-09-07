const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
    departure:{
        type:String,
        required:true
    },
    destination:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    pickupLocations: {
        required:true,
        type:[String]
    },
    duration:{
        required:true,
        type:Number
    },
    returnPickupLocations: {
        type:[String]
    },
    subRoutes:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Route",
        default:[]
    }
})

module.exports = mongoose.model("Route",routeSchema)
