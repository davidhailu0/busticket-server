const UserReservation = require("../models/userReservation.model")
const { Server } = require("socket.io");
const event = require("events")
const reserveSeat = require("./reserveSeat.service")

let eventEmitter = new event.EventEmitter()

let io;

const getUserReservation = async()=>{
  let findedObj = await UserReservation.findOne()
  if(!findedObj){
    findedObj = await UserReservation.create({})
  }
  let userReservations = findedObj.userReservations
  userReservations = JSON.parse(userReservations)
  return {id:findedObj._id,userReservations};
}

eventEmitter.on("REMOVEBOOKED",async(msg)=>{
  const {tripId,seatNumbers} = JSON.parse(msg)
  let {id,userReservations} = await getUserReservation()
  let foundedTripUser = userReservations.find((obj)=>obj[tripId])
  userReservations = userReservations.filter((obj)=>!obj[tripId])
  foundedTripUser[tripId]["bookedSeats"] = foundedTripUser[tripId]["bookedSeats"].filter(st=>!seatNumbers.includes(st))
  userReservations.push(foundedTripUser)
  await UserReservation.findByIdAndUpdate(id,{$set:{userReservations:JSON.stringify(userReservations)}},{new:true})
  io.emit("UPDATERESERVED",JSON.stringify(userReservations))
})

module.exports = function(server){
    io = new Server(server,{
        cors:{
          origin:"*",
          methods:["GET","POST"]
        }
      })
    io.on('connection', socket => {
        socket.on("reservedSeat",async(reservedSeatsInfo)=>{
          const {tripId,passenger,seatNumbers} = JSON.parse(reservedSeatsInfo)
          let {id,userReservations} = await getUserReservation()
          const foundedTrip = userReservations.find((obj)=>obj[tripId])
          if(!foundedTrip){
            const addedTrip = {[tripId]:{
                [passenger]:[...seatNumbers]
            }}
            userReservations.push(addedTrip)
          }
          else{
              let foundedTripUser = userReservations.find((obj)=>obj[tripId])
              userReservations = userReservations.filter((obj)=>!obj[tripId])
              foundedTripUser[tripId][passenger] = [...seatNumbers]
              userReservations.push(foundedTripUser)
          }
          await UserReservation.findByIdAndUpdate(id,{$set:{userReservations:JSON.stringify(userReservations)}})
          setTimeout(async()=>{
            let {id,userReservations} = await getUserReservation()
            let foundedTripUser = userReservations.find((obj)=>obj[tripId])
            if(!foundedTripUser[tripId]["bookedSeats"]||!foundedTripUser[tripId]["bookedSeats"].includes(seatNumbers[0])){
              userReservations = userReservations.filter((obj)=>!obj[tripId])
              foundedTripUser[tripId][passenger] = foundedTripUser[tripId][passenger].filter((st=>!seatNumbers.includes(st)))
              userReservations.push(foundedTripUser)
              await reserveSeat(tripId,userReservations.find((obj)=>obj[tripId]))
              await UserReservation.findByIdAndUpdate(id,{$set:{userReservations:JSON.stringify(userReservations)}})
              io.emit("UPDATERESERVED",JSON.stringify(userReservations))
            }
          },1000*60*30)
          await reserveSeat(tripId,userReservations.find((obj)=>obj[tripId]))
          io.emit("UPDATERESERVED",JSON.stringify(userReservations))
        })
        socket.on("REMOVE SEAT",async(msg)=>{
          const {userID,tripID,ticketInfo} = JSON.parse(msg)
          let {id,userReservations} = await getUserReservation()
          let foundedTripUser = userReservations.find((obj)=>obj[tripID])
          userReservations = userReservations.filter((obj)=>!obj[tripID])
          foundedTripUser[tripID][userID] = foundedTripUser[tripID][userID].filter(st=>!ticketInfo.includes(st))
          foundedTripUser[tripID]["bookedSeats"] = foundedTripUser[tripID]["bookedSeats"]?[...foundedTripUser[tripID]["bookedSeats"],...ticketInfo]:[...ticketInfo]
          userReservations.push(foundedTripUser)
          await UserReservation.findByIdAndUpdate(id,{$set:{userReservations:JSON.stringify(userReservations)}},{new:true})
        });
        socket.on("tripId",async(msg)=>{
            const {tripId,bookedSeats} = JSON.parse(msg)
            let {id,userReservations} = await getUserReservation()
            let foundedTrip = userReservations.find((obj)=>obj[tripId])
            if(!foundedTrip){
                foundedTrip = {[tripId]:{bookedSeats}}
                userReservations.push(foundedTrip)
                await UserReservation.findByIdAndUpdate(id,{$set:{userReservations:JSON.stringify(userReservations)}},{new:true})
            }
            io.emit("UPDATERESERVED",JSON.stringify(userReservations))
        })
        socket.on("tripIdCheck",async(msg)=>{
          const {tripId,bookedSeats} = JSON.parse(msg)
          let {id,userReservations} = await getUserReservation()
          let foundedTrip = userReservations.find((obj)=>obj[tripId])
          if(!foundedTrip){
              foundedTrip = {[tripId]:{bookedSeats}}
              userReservations.push(foundedTrip)
              await UserReservation.findByIdAndUpdate(id,{$set:{userReservations:JSON.stringify(userReservations)}},{new:true})
          }
          io.emit("UPDATERESERVEDCHECK",JSON.stringify(userReservations))
      })
      });
}

module.exports.getIO = function() {
    if (!io) {
        throw new Error("Must call module constructor function before you can get the IO instance");
    }
    return {io,eventEmitter};
}