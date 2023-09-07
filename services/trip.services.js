const Trip = require("../models/trip.model")
const BookedTrip = require("../models/registeredTrip")

const addTrip = async(req,res)=>{
  try{
    const trip = new Trip(req.body)
  await trip.save()
  return res.status(201).json(trip);
  }
  catch(e){
    return res.status(500).json({"status":"error","message":`${e.message}`})
  }
}

const getAllTrip = async(req,res)=>{
  try{
    const allTrips = await Trip.find()
    return res.status(200).json(allTrips)
  }
  catch(e){
    return res.status(500).json({"status":"error","message":`${e.message}`})
  }
}

const getTripById = async(req,res)=>{
  const {id} = req.params
  try{
    const tripById = await Trip.findById(id)
    return res.status(200).json(tripById)
  }
  catch(e){
    return res.status(500).json({"status":"error","message":`${e.message}`})
  }
}

const getSearchedTrips = async(req,res)=>{
  const {departure,destination,date,availableSeats} = req.query
  try{
    const result = await Trip.find({departure,destination,isTripAvaible:true})
    if(result.length===0){
      return res.status(200).json({"status":"success",data:result})
    }
    const getBookedTrip = await BookedTrip.find({departure,destination,date})
    const foundedResult = []
    if(getBookedTrip.length===0){
      result.forEach((trip)=>{

      })
    }
    return res.status(200).json({"status":"success",data:result})
  }
  catch(e){
    return res.status(500).json({"status":"error","message":"There is an error in the server"})
  }
}

const updateTrip = async(req,res)=>{
  const {update_starting_place,update_destination,update_dateFrom,update_dateUpto} = req.body;
  const {starting_place,destination,dateFrom,dateUpto} = req.query
  try{
    const result = await Trip.updateMany({starting_place,destination,dateFrom,dateUpto},{starting_place:update_starting_place,destination:update_destination,dateFrom:update_dateFrom,dateUpto:update_dateUpto})
    return res.json(200).json(result)
  }
  catch(e){
    return res.status(500).json({"status":"error","message":"There is an error in the server"})
  }
}

const deleteTrip = async(req,res)=>{
  const {starting_place,destination,dateFrom,dateUpto} = req.body
  try{
    await Trip.deleteMany({starting_place,destination,dateFrom,dateUpto},{starting_place:update_starting_place,destination:update_destination,dateFrom:update_dateFrom,dateUpto:update_dateUpto})
    return res.status(204)
  }
  catch(e){
    return res.status(500).json({"status":"error","message":"There is an error in the server"})
  }
}

module.exports = {
    getAllTrip,getTripById,addTrip,getSearchedTrips,updateTrip,deleteTrip
}