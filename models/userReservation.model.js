const mongoose = require("mongoose")

const UserReservationSchema = new mongoose.Schema({
    userReservations:{
        type:String,
        default:"[]"
    }
})

module.exports = mongoose.model("UserReservation",UserReservationSchema)