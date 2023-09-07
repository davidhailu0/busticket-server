const mongoose = require("mongoose")

const ScheduleSchema = new mongoose.Schema({
    departure:String,
    destination:String,
    busCompany:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Bus"
    },
    routeID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Route"
    },
    assignedBuses:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Bus"
    },
    departureDays:[[Date]],
    departureTime:[[String]],
    returnTime:[[String]]
})

module.exports = mongoose.model("Schedule",ScheduleSchema)