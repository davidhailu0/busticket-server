const Trip = require("../models/trip.model")

const reserveTheSelectedSeat = async(tripId,reservedSeats)=>{
    const allReservedSeats = Object.values(reservedSeats[tripId]).reduce((res,cur)=>{
        return [...res,...cur]
    },[])
    return await Trip.findByIdAndUpdate(tripId,{$set:{reservedSeats:allReservedSeats}},{new:true})
}

module.exports = reserveTheSelectedSeat