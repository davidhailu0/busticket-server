const Schedule = require("../../models/schedule.model")
const Route = require("../../models/route.model") 
const Bus = require("../../models/bus.model")
const Employee = require("../../models/employee.model")
const BusCompany = require("../../models/busCompany.model")
const Trip = require("../../models/trip.model")
const createActivityLog = require("../../utils/createActivityLog")

const changeExpiredDates = (datesArray,departureTime)=>{
    let tempAssignedDates = []
    let tempAssignedDepartureTime = []
    let count = 0;
    for(let dt of datesArray){
         const dpDyDate = new Date(new Date(dt).toDateString())
         const dateNow = new Date(new Date(Date.now()).toDateString())
        if(dpDyDate.getTime()>dateNow.getTime()){
            tempAssignedDates.push(dpDyDate)
        }
        else{
            dpDyDate.setDate(dpDyDate.getDate()+7)
            tempAssignedDates.push(dpDyDate)
        }
        if(departureTime){
            tempAssignedDates.sort((a,b)=>new Date(a).getTime()-new Date(b).getTime())
            const foundedIndex = tempAssignedDates.findIndex(dt=>new Date(dt).getTime()===dpDyDate.getTime())
            tempAssignedDepartureTime.splice(foundedIndex,0,departureTime[count])
        }
        count++;
    }
    return {tempAssignedDates,tempAssignedDepartureTime}
}

const mapBusDriver = async(updatedScheduledTrip)=>{
    let assignedBuses = []
    for(let bs of updatedScheduledTrip.assignedBuses){
            const bus = await Bus.findById(bs)
            const driver = await Employee.findById(bus.driver)
            assignedBuses.push({...bus.toObject(),driver:driver.toObject()})
    }
    return assignedBuses;
}

const filterAndUpdateScheduledTrips = async(schedulesFound)=>{
    const newSchedule = []
            for(let sch of schedulesFound){
                let routeOfTheSchedule = await Route.findOne({departure:sch.departure,destination:sch.destination})
                if(!routeOfTheSchedule){
                    routeOfTheSchedule = await Route.findOne({departure:sch.destination,destination:sch.departure})
                }
                let assignedBuses = []
                if(sch.assignedBuses&&sch.assignedBuses.length>0){
                    for(let bs of sch.assignedBuses){
                        const busFound = await Bus.findById(bs)
                        if(busFound.assignedDates&&busFound.assignedDates.length>0){
                            let newAssignedDatesforBus = changeExpiredDates(busFound.assignedDates,null)["tempAssignedDates"]
                            await Bus.findByIdAndUpdate(bs,{$set:{assignedDates:newAssignedDatesforBus}},{new:true})
                        }
                        let driver = null;
                        if(busFound.driver){
                            driver = await Employee.findById(busFound.driver)
                            driver = driver.toObject()
                        }
                        assignedBuses.push({...busFound.toObject(),driver})
                    }
                }
                let departureDays = []
                let departureTime = []
                let count = 0;
                for(let dpDy of sch.departureDays){
                    const newAssignedDates = changeExpiredDates(dpDy,sch.departureTime[count])
                    departureDays.push(newAssignedDates["tempAssignedDates"])
                    departureTime.push(newAssignedDates["tempAssignedDepartureTime"])
                    count++
                }
                await Schedule.findByIdAndUpdate(sch._id,{$set:{departureDays,departureTime}},{new:true})
                newSchedule.push({...sch.toObject(),duration:routeOfTheSchedule.duration,assignedBuses,departureDays})
            }
    return newSchedule
}
const createNewScheduledTrips = async(busCompanyID)=>{
    const busCompany = await BusCompany.findById(busCompanyID)
    for(let rt of busCompany.routes){
        const routeFound = await Route.findById(rt)
        let newSchedule = new Schedule({departure:routeFound.departure,destination:routeFound.destination,busCompany:busCompanyID})
        await newSchedule.save()
        newSchedule = new Schedule({departure:routeFound.destination,destination:routeFound.departure,busCompany:busCompanyID})
        await newSchedule.save()
    }
    const schedules = await Schedule.find({busCompany:busCompanyID})
    const foundedSchedules = []
    for(let sch of schedules){
        let routeOfTheSchedule = await Route.findOne({departure:sch.departure,destination:sch.destination})
        if(!routeOfTheSchedule){
            routeOfTheSchedule = await Route.findOne({departure:sch.destination,destination:sch.departure})
        }
        foundedSchedules.push({...sch.toObject(),duration:routeOfTheSchedule.duration})
    }
    return foundedSchedules
}

const checkIfExistOrCreate = async(busCompanyID,routeIDS,schedulesFound)=>{
    for(let rt of routeIDS){
        let route = await Route.findById(rt)
        let check = schedulesFound.find(({departure,destination})=>departure===route.departure&&destination===route.destination)
        if(!check){
            let newSchedule = new Schedule({departure:route.departure,destination:route.destination,busCompany:busCompanyID})
            await newSchedule.save()
            newSchedule = new Schedule({departure:route.destination,destination:route.departure,busCompany:busCompanyID})
            await newSchedule.save()
        }
    }
}

const scheduledQueries = {
    scheduledTrips:async(_,{busCompanyID})=>{
        let schedulesFound = await Schedule.find({busCompany:busCompanyID})
        const busCompany = await BusCompany.findById(busCompanyID)
        if(busCompany.routes.length*2>schedulesFound.length){
            await checkIfExistOrCreate(busCompanyID,busCompany.routes,schedulesFound)
            schedulesFound = await Schedule.find({busCompany:busCompanyID})
        }
        if(schedulesFound.length!==0){
            return await filterAndUpdateScheduledTrips(schedulesFound)
        }
        return createNewScheduledTrips(busCompanyID)
    },
    scheduledTrip:async(_,{tripID})=>{
        const scheduledTripFound = await Schedule.findById(tripID);
        const returnTrip = await Schedule.findOne({departure:scheduledTripFound.destination,destination:scheduledTripFound.departure,busCompany:scheduledTripFound.busCompany})
        let routeOfTheSchedule = await Route.findOne({departure:scheduledTripFound.departure,destination:scheduledTripFound.destination})
        if(!routeOfTheSchedule){
            routeOfTheSchedule = await Route.findOne({departure:scheduledTripFound.destination,destination:scheduledTripFound.departure})
        }
        let assignedBuses = [];
        if(scheduledTripFound.assignedBuses&&scheduledTripFound.assignedBuses.length>0){
            for(let bs of scheduledTripFound.assignedBuses){
                const assignedBus = await Bus.findById(bs)
                let driver = null;
                if(assignedBus.driver){
                    driver = await Employee.findById(assignedBus.driver)
                    driver = driver.toObject()
                }
                assignedBuses.push({...assignedBus.toObject(),driver})
            }
        }
        return {...scheduledTripFound.toObject(),assignedBuses,duration:routeOfTheSchedule.duration,returnDays:returnTrip.departureDays,returnTime:returnTrip.departureTime}
    }
}

const scheduledMutations = {
    updateScheduledTrip:async(_,{id,updatedSchedule,activity})=>{
        let departureDays = updatedSchedule.departureDays
        let returnDays = updatedSchedule.returnDays
        const newSchedule = await Schedule.findByIdAndUpdate(id,{$set:{assignedBuses:updatedSchedule.assignedBuses,departureDays:departureDays,departureTime:updatedSchedule.departureTime}},{new:true})
        await Schedule.findOneAndUpdate({departure:newSchedule.destination,destination:newSchedule.departure},{$set:{assignedBuses:updatedSchedule.assignedBuses,departureDays:returnDays,departureTime:updatedSchedule.returnTime}},{new:true})
        let assignedBuses = []
        let count = 0
        for(let bs of updatedSchedule.assignedBuses){
            const allSchedules = await Schedule.find({assignedBuses:bs})
            let departureDates = []
            for(let sch of allSchedules){
                const ind = sch.assignedBuses.indexOf(bs)
                departureDates = [...departureDates,...sch.departureDays[ind]]
            }
            const bus = await Bus.findByIdAndUpdate(bs,{$set:{assignedDates:[...departureDates]}},{new:true})
            const driver = await Employee.findById(bus.driver)
            assignedBuses.push({...bus.toObject(),driver:driver.toObject()})
            count++;
        }
        await Trip.deleteMany()
        await createActivityLog(activity.companyId,activity.name,`${newSchedule.departure} - ${newSchedule.destination} Schedule has been updated`)
        return {...newSchedule.toObject(),assignedBuses}
    },
    reassignScheduledTrip:async(_,{id,reassignedSchedule,activity})=>{
        const todayDate = new Date(new Date(Date.now()).toDateString())
        const foundedSchedule = await Schedule.findById(id)
        if(reassignedSchedule["previousBusID"]){
            const indexOfPreviousBusID = foundedSchedule["assignedBuses"].indexOf(reassignedSchedule["previousBusID"])
            let newAssignedBus = [...foundedSchedule["assignedBuses"]]
            newAssignedBus[indexOfPreviousBusID] = reassignedSchedule["newBusID"]
            const updatedScheduledTrip = await Schedule.findByIdAndUpdate(id,{$set:{assignedBuses:newAssignedBus}},{new:true})
            await Trip.updateMany({departure:foundedSchedule.departure,destination:foundedSchedule.destination,departureDate:{$gte:todayDate.toISOString()}},{$set:{bus:reassignedSchedule["newBusID"]}},{new:true})
            const filteredDates = foundedSchedule["departureDays"][indexOfPreviousBusID]&&foundedSchedule["departureDays"][indexOfPreviousBusID].map(dt=>new Date(dt).getTime())
            const previousBus = await Bus.findById(reassignedSchedule["previousBusID"])
            const previousBusUpdatedDates = previousBus["assignedDates"].filter(dt=>filteredDates&&!filteredDates.includes(new Date(dt).getTime())) 
            await Bus.findByIdAndUpdate(reassignedSchedule["previousBusID"],{$set:{assignedDates:previousBusUpdatedDates}},{new:true})
            await Bus.findByIdAndUpdate(reassignedSchedule["newBusID"],{$set:{assignedDates:!filteredDates?[]:filteredDates}},{new:true})
            await createActivityLog(activity.companyId,activity.name,`${updatedScheduledTrip.departure} - ${updatedScheduledTrip.destination} Schedule has been updated`)
            return {...updatedScheduledTrip.toObject(),assignedBuses:await mapBusDriver(updatedScheduledTrip)}
        }
        await createActivityLog(activity.companyId,activity.name,`${foundedSchedule.departure} - ${foundedSchedule.destination} Schedule has been updated`)
        return {...foundedSchedule.toObject(),assignedBuses:await mapBusDriver(foundedSchedule)}
    }
}

module.exports = {scheduledQueries,scheduledMutations}