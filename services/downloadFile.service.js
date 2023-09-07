const path = require("path")
const XLSX = require("xlsx")
const User = require("../models/user.model")
const Ticket = require("../models/ticket.model")
const Trip = require("../models/trip.model")

const downloadFile = async(req,res)=>{
    const wb = XLSX.utils.book_new()
    const {tripId} = req.params
    const foundTrip = await Trip.findById(tripId)
    const foundTickets = await Ticket.find({departure:foundTrip.departure,destination:foundTrip.destination,date:foundTrip.departureDate,bus:foundTrip.bus,status:"RESERVED"})
    const allPassengers = []
    for(let ticket of foundTickets){
            const passenger = await User.findById(ticket.passengerId).select(["-_id","-password","-active","-role","-__v"])
            allPassengers.push({...passenger.toObject(),pickupLocation:ticket.pickupLocation})
    }
    let temp = JSON.stringify(allPassengers)
    temp = JSON.parse(temp)
    let ws = XLSX.utils.json_to_sheet(temp)
    let down = path.resolve(__dirname+'/../public/PassengerData.xlsx')
    XLSX.utils.book_append_sheet(wb,ws,"Passengers");
    XLSX.writeFile(wb,down)
    res.download(down)
}

module.exports={downloadFile}