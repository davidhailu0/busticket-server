const Trip = require("../../models/trip.model")
const Route = require("../../models/route.model")
const Bus = require("../../models/bus.model")
const BusCompany = require("../../models/busCompany.model")
const Employee = require("../../models/employee.model")
const Schedule = require("../../models/schedule.model")
const formatAMPM = require("../../utils/formatTime")
const createActivityLog = require("../../utils/createActivityLog")


const tripInitialization = async(busCompanyId)=>{
        const tripforBusCompany = await Trip.find()
        let allBusesInTheSameCompany = await Bus.find({busOwner:busCompanyId})
        allBusesInTheSameCompany = allBusesInTheSameCompany.map(bs=>bs["_id"].toString())
        const registeredTripRequired = []
        for(let trp of tripforBusCompany){
            if(allBusesInTheSameCompany.includes(trp["bus"].toString())){
                registeredTripRequired.push(trp)
            }
        } 
        let scheduledTrip = await Schedule.find({busCompany:busCompanyId})
        let tripList = []
        for(let sch of scheduledTrip){
            for(let ind in sch.assignedBuses){
                const allTripOfBus = await Trip.find({bus:sch.assignedBuses[ind]})
                const bus = await Bus.findById(sch.assignedBuses[ind])
                const createdDpTrp = allTripOfBus.map((obj)=>({dt:new Date(obj.departureDate).getTime(),dp:obj["departure"],ds:obj["destination"]}))
                let count = 0;
                for(let dt of sch.departureDays[ind]){
                   const dateTime = new Date(dt)
                   const dateNow = new Date(new Date().toDateString())
                   if(dateTime.getTime()<dateNow.getTime()){
                        dateTime.setDate(dateTime.getDate()+7)
                        const newTrip = new Trip({departure:sch.departure,destination:sch.destination,departureDate:dateTime.toISOString(),bus:bus._id,numberOfAvailableSeats:bus.numberOfSeats,bookedSeats:bus.unavailableSeats.map(st=>st.toString()),departureTime:sch.departureTime[ind][count]})
                        await newTrip.save()
                        tripList.push(newTrip)
                        let newDepartureDys = [...sch.departureDays]
                        let dpDaysOfIndex = sch.departureDays[ind].filter(date=>new Date(date).getTime()!==new Date(dt).getTime())
                        dpDaysOfIndex.push(dateTime)
                        newDepartureDys[ind] = dpDaysOfIndex
                        await Schedule.findByIdAndUpdate(sch._id,{$set:{departureDays:newDepartureDys}},{new:true})
                   }
                   else if(createdDpTrp.findIndex((obj=>obj["dt"]===dateTime.getTime()&&sch["departure"]===obj["dp"]&&obj["ds"]===sch["destination"]))===-1){   
                        const newTrip = new Trip({departure:sch.departure,destination:sch.destination,departureDate:dateTime.toISOString(),bus:bus._id,numberOfAvailableSeats:bus.numberOfSeats,bookedSeats:bus.unavailableSeats.map(st=>st.toString()),departureTime:sch.departureTime[ind][count]})
                        await newTrip.save()
                        createdDpTrp.push({dt:dateTime.getTime(),dp:sch["departure"],ds:sch["destination"]})
                        tripList.push(newTrip)
                   }
                   count++;
                }
            }
        }
        tripList = await mapTripsAndBusProvider(tripList)
        return [...await mapTripsAndBusProvider(registeredTripRequired),...tripList]
}

const everyBusCompanyTripInit = async()=>{
    const busCompanies = await BusCompany.find({verified:true})
    for(let bsCompanyId of busCompanies){
        await tripInitialization(bsCompanyId._id)
    }
}

const createNewTrips = async(departure,destination,departureDate)=>{
    let routeFound = await Route.findOne({departure,destination})
    if(!routeFound){
        routeFound = await Route.findOne({departure:destination,destination:departure})
    }
    const bookedTrips = await Trip.find({departure,destination,departureDate:new Date(new Date(parseInt(departureDate)).toDateString()).toISOString(),numberOfAvailableSeats:{$eq:0}})
    const bookedTripsBusesId = bookedTrips.map((bookdTrp)=>(bookdTrp.bus))
    let busesWithAvailableTrips = [];
    busesWithAvailableTrips = (await Schedule.find({departure,destination})).filter((obj)=>obj.assignedBuses&&obj.assignedBuses.length>0&&bookedTripsBusesId.filter(id=>!obj.assignedBuses.includes(id)))
    const newIDAndBus = []
    let count = 0
    for(let obj of busesWithAvailableTrips){
        for(let dy in obj['departureDays']){
            const checkDay = obj['departureDays'][dy].find(dt=>new Date(dt).getTime()===new Date(new Date(parseInt(departureDate)).toDateString()).getTime())
            const indexOfDepartureDay = obj['departureDays'][dy].findIndex(dt=>new Date(dt).getTime()===new Date(new Date(parseInt(departureDate)).toDateString()).getTime())
            if(checkDay){
                newIDAndBus.push({id:obj['assignedBuses'][dy],departureTime:obj["departureTime"][count][indexOfDepartureDay]})
            }
            count++
        }
    }
    busesWithAvailableTrips = newIDAndBus.filter(el=>el!==undefined)
    for(let {id,departureTime} of newIDAndBus){
        const busOfTheTrip = await Bus.findById(id)
        const newTrip = new Trip({departure,destination,departureDate:new Date(new Date(parseInt(departureDate)).toDateString()).toISOString(),bus:id,numberOfAvailableSeats:busOfTheTrip.numberOfSeats,bookedSeats:busOfTheTrip.unavailableSeats.map(st=>st.toString()),departureTime})
        await newTrip.save() 
    }
    const tripList = await Trip.find({departure,destination,departureDate:new Date(new Date(parseInt(departureDate)).toDateString()).toISOString(),numberOfAvailableSeats:{$gte:1}})
    return mapTripsAndBusProvider(tripList)
}

const mapTripsAndBusProvider = async(searchedTrips)=>{
    const searchedTripsClone = []
    for(let trp of searchedTrips){
        const bus = await Bus.findById(trp.bus)
        let route = await Route.findOne({departure:trp.departure,destination:trp.destination})
        if(!route){
            route = await Route.findOne({departure:trp.destination,destination:trp.departure})
        }
        const busOwner = await BusCompany.findById(bus.busOwner)
        if(busOwner.verified){
            searchedTripsClone.push({...trp.toObject(),bus:{...bus.toObject(),busOwner:busOwner.toObject()},route:route.toObject()})
        }
    }
    return searchedTripsClone;
}

const mapTripWithBusAndBusOwner = async(searchedTrip)=>{
    const bus = await Bus.findById(searchedTrip.bus)
        let route = await Route.findOne({departure:searchedTrip.departure,destination:searchedTrip.destination})
        if(!route){
            route = await Route.findOne({departure:searchedTrip.destination,destination:searchedTrip.departure})
        }
        const driverFound = await Employee.findById(bus.driver)
        let driverAssistantFound = null
        if(searchedTrip.driverAssistant){
            driverAssistantFound = await Employee.findById(searchedTrip.driverAssistant)
            driverAssistantFound = driverAssistantFound.toObject()
        }
        const busOwner = await BusCompany.findById(bus.busOwner)
        return {...searchedTrip.toObject(),route:route.toObject(),bus:{...bus.toObject(),busOwner:busOwner.toObject(),driver:driverFound.toObject()},driverAssistant:driverAssistantFound}
}

const tripQueries = {
    trips: async(_,{trip})=>{
        await everyBusCompanyTripInit()
        const {departure,destination,departureDate} = trip
        let routeFound = await Route.findOne({departure,destination})
        if(!routeFound){
            routeFound = await Route.findOne({departure:destination,destination:departure})
        }
        if(!routeFound){
            return new Error("No Trip Available")
        }
        const currentTime = formatAMPM(new Date)
        const departureDateDay = new Date(parseInt(departureDate)).toDateString()
        const todayDate = new Date().toDateString()
        if(departureDateDay===todayDate){
            if(currentTime.includes("AM")&&parseInt(currentTime.substring(0,currentTime.indexOf(":")))<4){
                const searchedTrips = await Trip.find({departure,destination,departureDate:new Date(new Date(parseInt(departureDate)).toDateString()).toISOString(),numberOfAvailableSeats:{$gte:1}})
                return await mapTripsAndBusProvider(searchedTrips);
            }
            else if(currentTime.includes("AM")&&parseInt(currentTime.substring(0,currentTime.indexOf(":")))<12){
                const searchedTrips = await Trip.find({departure,destination,departureDate:new Date(new Date(parseInt(departureDate)).toDateString()).toISOString(),numberOfAvailableSeats:{$gte:1},departureTime:"12:00 PM"})
                return await mapTripsAndBusProvider(searchedTrips)
            }
        }
        else{
            const searchedTrips = await Trip.find({departure,destination,departureDate:new Date(new Date(parseInt(departureDate)).toDateString()).toISOString(),numberOfAvailableSeats:{$gte:1}})
            if(searchedTrips.length!==0){
                const mappedSearchTripList = await mapTripsAndBusProvider(searchedTrips)
                return mappedSearchTripList;
            }
            else{
                return createNewTrips(departure,destination,departureDate) 
            }
        }
        
    },
    allTrips:async()=>{
        await everyBusCompanyTripInit()
        const dateToday = new Date(new Date().toDateString())
        const currentTime = formatAMPM(new Date)
        let todaysTrips = []
        if(currentTime.includes("AM")&&parseInt(currentTime.substring(0,currentTime.indexOf(":")))<4){
            const searchedTrips = await Trip.find({departureDate:dateToday.toISOString(),numberOfAvailableSeats:{$gte:1}})
            for(let trp of searchedTrips){
                todaysTrips.push(trp.toObject())
            }
        }
        else if(currentTime.includes("AM")&&parseInt(currentTime.substring(0,currentTime.indexOf(":")))<12){
            const searchedTrips = await Trip.find({departureDate:dateToday.toISOString(),numberOfAvailableSeats:{$gte:1},departureTime:"12:00 PM"})
            for(let trp of searchedTrips){
                todaysTrips.push(trp.toObject())
            }
        }
        dateToday.setDate(dateToday.getDate()+1)
        const allTrips = await Trip.find({departureDate:{$gte:dateToday.toISOString()}})
        return await mapTripsAndBusProvider([...allTrips,...todaysTrips])
    },
    trip: async(_,{id})=>{
        const searchedTrip = await Trip.findById(id)
        return mapTripWithBusAndBusOwner(searchedTrip)
    },
    tripForBusCompany:async(_,{busCompanyId})=>{
        return await tripInitialization(busCompanyId);
    }
}


const tripMutations = {
    updateTrip:async(_,{id,trip,activity})=>{
        const updatedTrip = await Trip.findByIdAndUpdate(id,{$set:{...trip}},{new:true})
        await createActivityLog(activity.companyId,activity.name,`${updatedTrip.departure} - ${updatedTrip.destination} trip has been updated `)
        return mapTripWithBusAndBusOwner(updatedTrip)
    },
    deleteTrip: async(_,{id})=>{
        return await Trip.findByIdAndRemove(id)
    }
}

module.exports = {tripQueries,tripMutations}