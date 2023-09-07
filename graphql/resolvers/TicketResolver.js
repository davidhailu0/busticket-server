const Ticket = require("../../models/ticket.model")
const Bus = require("../../models/bus.model")
const BusCompany = require("../../models/busCompany.model")
const User = require("../../models/user.model")
const Route = require("../../models/route.model")
const Trip = require("../../models/trip.model")
const {io,eventEmitter} = require("../../services/socketIO").getIO()
const {computeTicketInfoAndReturn} = require("./callCenterResolver")

const ONEHOUR30MIN = (1000*60*60)+(1000*60*30)

const getAllMyTickets = async(foundedTickets)=>{
    if(foundedTickets.length===0){
        return []
    }
    const modifiedTickets = [];
    const reservedBus = await Bus.findById(foundedTickets[0]["bus"])
    const busCompany = await BusCompany.findById(reservedBus.busOwner)
    for(let tcket of foundedTickets){
        const passenger = await User.findById(tcket.passengerId)
        const ticketObj = tcket.toObject()
        const ticketPurchaser = await User.findById(tcket.ticketPurchaser)
        modifiedTickets.push({...ticketObj,bus:{...reservedBus.toObject(),busOwner:busCompany.toObject()},passenger:passenger.toObject(),ticketPurchaser:ticketPurchaser.toObject()})
    }
    return modifiedTickets
}

const sendReservedMessage = (passengersList,language)=>{
    const passengerNameList = []
    const passengerPhoneList = []
    for(let pass of passengersList){
        passengerNameList.push(pass.passenger.name)
        passengerPhoneList.push(pass.passenger.phoneNumber)
    }
    io.emit("SEND RESERVE TICKET",JSON.stringify({
        language,
        listOfPassengersName:passengerNameList,
        listOfPassengersPhone:passengerPhoneList,
        departure:passengersList[0].departure,
        destination:passengersList[0].destination,
        departureDate:passengersList[0].date,
        departureTime:passengersList[0].time
    }))
}

const ticketQueries = {
    tickets: async(_,args)=>{
        return Ticket.find()
    },
    ticket: async(_,{id})=>{
        return Ticket.findById(id)
    },
    reservedTickets:async(_,{referenceID})=>{
        const foundedTickets = await Ticket.find({referenceID})
        return await getAllMyTickets(foundedTickets);
    },
    myTickets:async(_,{userId})=>{
        const allMyTickets = await Ticket.find({ticketPurchaser:userId});
        return await getAllMyTickets(allMyTickets)
    },
    searchTicket:async(_,{searchValue})=>{
        const passanger = await User.findOne({phoneNumber:searchValue})
        if(passanger){
            const foundedTickets = await Ticket.find({$or:[{passengerId:passanger._id},{ticketPurchaser:passanger._id}]})
            return getAllMyTickets(foundedTickets)
        }
        let foundedTickets = await Ticket.find({referenceID:searchValue})
        if(foundedTickets.length===0){
            let ticketsById = await Ticket.find()
            ticketsById = ticketsById.filter(obj=>obj._id.toString().includes(searchValue))
            return getAllMyTickets(ticketsById)
        }
        return getAllMyTickets(foundedTickets)
    }
}

const ticketMutations = {
    reserveTicket:async(_,{ticket})=>{
        const {ticketPurchaser,
            passengerId,
            busId,pickupLocations,departure,destination,
            date,time,reservedSeats,bookedBy,bankName,bankAccount,referenceID,
            language
        } = ticket
        let route = await Route.findOne({departure,destination})
        if(!route){
            route = await Route.findOne({departure:destination,destination:departure})
        }
        route = route.toObject()
        for(let ind in passengerId){
            let newTicket;
            if(pickupLocations){
                newTicket = new Ticket({ticketPurchaser,passengerId:passengerId[ind],price:route["price"],bus:busId,pickupLocation:pickupLocations[ind],departure,destination,date:new Date(new Date(parseInt(date)).toDateString()).toISOString(),time,referenceID,reservedSeat:reservedSeats[ind],reservedAt:Date.now(),bookedBy,bankName,bankAccount})
            }
            else{
                newTicket = new Ticket({ticketPurchaser,passengerId:passengerId[ind],price:route["price"],bus:busId,departure,destination,date:new Date(new Date(parseInt(date)).toDateString()).toISOString(),time,referenceID,reservedSeat:reservedSeats[ind],reservedAt:Date.now(),bookedBy,bankName,bankAccount})
            }
            await newTicket.save();
        }
        const registeredTripInfo = await Trip.findOne({departure,destination,departureDate:new Date(new Date(parseInt(date)).toDateString()).toISOString(),departureTime:time})
        await Trip.findOneAndUpdate({departure,destination,departureDate:new Date(new Date(parseInt(date)).toDateString()).toISOString(),departureTime:time},{$set:{numberOfAvailableSeats:registeredTripInfo.numberOfAvailableSeats-reservedSeats.length,reservedSeats:[...registeredTripInfo.reservedSeats,...reservedSeats]}},{new:true})
        const reservedTicket = await Ticket.find({referenceID})
        const providedBus = (await Bus.findById(busId)).toObject()
        const newReservedTicket = [];
        for(let rsrvedTkt of reservedTicket){
            rsrvedTkt = rsrvedTkt.toObject()
            rsrvedTkt.bus = providedBus
            const  passengerId = rsrvedTkt.passengerId
            const passengerInfo = await User.findById(passengerId)
            rsrvedTkt.passenger = passengerInfo.toObject()
            rsrvedTkt.referenceID = referenceID
            newReservedTicket.push(rsrvedTkt)
        }
        sendReservedMessage(newReservedTicket,language);
        setTimeout(async()=>{
            const ticketStatus = await Ticket.find({referenceID,status:"RESERVED"})
            if(ticketStatus.length>0){
                const reservedSeatsArr = ticketStatus.map((obj=>obj.reservedSeat))
                const rgstrdtrpNow = await Trip.findOne({departure,destination,departureDate:new Date(new Date(parseInt(date)).toDateString()).toISOString(),departureTime:time})
                const filteredReservedSeats = rgstrdtrpNow.reservedSeats.filter(rsrved=>!reservedSeatsArr.includes(rsrved))
                await Trip.findOneAndUpdate({departure,destination,departureDate:new Date(new Date(parseInt(date)).toDateString()).toISOString(),departureTime:time},{$set:{numberOfAvailableSeats:rgstrdtrpNow.numberOfAvailableSeats+reservedSeats.length,reservedSeats:filteredReservedSeats}},{new:true})
                for(let tckt of ticketStatus){
                    await Ticket.findByIdAndUpdate(tckt._id,{$set:{terminatedAt:Date.now(),status:"TERMINATED",terminatedBy:"SERVER"}},{new:true})
                }
                const ticketInfo = await computeTicketInfoAndReturn()
                eventEmitter.emit("REMOVEBOOKED",JSON.stringify({
                    tripId:rgstrdtrpNow._id.toString(),
                    seatNumbers:reservedSeatsArr
                }))
                io.emit("NOTIFY CALL CENTER",JSON.stringify(ticketInfo))
            }
        },ONEHOUR30MIN)
        const ticketInfo = await computeTicketInfoAndReturn()
        io.emit("NOTIFY CALL CENTER",JSON.stringify(ticketInfo))
        return newReservedTicket
    },
    updateTicketInfo:async(_,{referenceID,ticketId,ticketInfo})=>{
        if(referenceID){
            if(ticketInfo.status&&ticketInfo.status==="TERMINATED"){
                await Ticket.updateMany({referenceID},{$set:{...ticketInfo,terminatedAt:Date.now()}},{new:true})
                const allReservedTickets = await Ticket.find({referenceID})
                const tripId = await Trip.findOne({departure:allReservedTickets[0].departure,destination:allReservedTickets[0].destination,departureDate:allReservedTickets[0].date})
                const allReservedSeats = allReservedTickets.map(obj=>obj.reservedSeat);
                eventEmitter.emit("REMOVEBOOKED",JSON.stringify({
                    tripId:tripId._id,
                    seatNumbers:allReservedSeats
                }))
            }
            else{
                await Ticket.updateMany({referenceID},{$set:{...ticketInfo}},{new:true})
            }
            const updatedTickets = await Ticket.find({referenceID})
            return await getAllMyTickets(updatedTickets)
        }
        if(ticketInfo.status&&ticketInfo.status==="TERMINATED"){
            await Ticket.findByIdAndUpdate(ticketId,{$set:{...ticketInfo,terminatedAt:Date.now()}},{new:true})
            const ticketInfoById = await Ticket.findById(ticketId)
            const tripId = await Trip.findOne({departure:ticketInfoById.departure,destination:ticketInfoById.destination,departureDate:ticketInfoById.date})
            eventEmitter.emit("REMOVEBOOKED",JSON.stringify({
                    tripId:tripId._id,
                    seatNumbers:[ticketInfoById.reservedSeat]
            }))
        }
        else{
            await Ticket.findByIdAndUpdate(ticketId,{$set:{...ticketInfo}},{new:true})
        }
        const updatedTicket = await Ticket.findById(ticketId)
        return await getAllMyTickets([updatedTicket])
    },
    searchWithBookingCode:async(_,{bookingCode})=>{
        const ticketsWithBookingCode = await Ticket.find({referenceID:bookingCode})
        const parsedTickets =  await getAllMyTickets(ticketsWithBookingCode)
        return parsedTickets
    },
    bookTicket:(_,{id})=>{
        
    },
    cancelTicket:(_,args)=>{

    }
}

module.exports = {ticketQueries,ticketMutations}
