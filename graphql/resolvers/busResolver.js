const Bus = require("../../models/bus.model")
const BusCompany = require("../../models/busCompany.model")
const Employee = require("../../models/employee.model")
const createActivityLog = require("../../utils/createActivityLog")

const busQueries = {
    bus:async(_,{busId})=>{
        const foundedBus = await Bus.findById(busId)
        let busDriver = null;
        if(foundedBus.driver){
            busDriver = await Employee.findById(foundedBus.driver)
            busDriver = busDriver.toObject()
        }
        return {...foundedBus.toObject(),driver:busDriver}
    },
    buses:(_,args)=>{
        return Bus.find()
    },
    allBusesOfTheCompany:async(_,{busID})=>{
        const allBusesWithTheID = await Bus.find({busOwner:busID})
        const allBusesWithDriverParsed = []
        for(let busObj of allBusesWithTheID){
                let driver = null
                if(busObj.driver){
                    driver = await Employee.findById(busObj.driver)
                    driver = driver.toObject()
                    if(driver.assignedTo){
                        let tempAssignedTo = await Bus.findById(driver.assignedTo)
                        tempAssignedTo = tempAssignedTo.toObject()
                        driver = {...driver,assignedTo:tempAssignedTo}
                    }
                }
                allBusesWithDriverParsed.push({...busObj.toObject(),driver})
        }
        return allBusesWithDriverParsed
    }
}

const busMutation = {
    addBus:async(_,{newBusInput,activity})=>{
        const busPlateNumberCheck = await Bus.findOne({plateNumber:newBusInput["plateNumber"]})
        const busVINCheck = await Bus.findOne({VIN:newBusInput["VIN"]})
        if(busPlateNumberCheck||busVINCheck){
                return new Error("This bus have already been registered")
        }
        const newBus = new Bus({...newBusInput})
        await newBus.save()
        const busOwnerOfBus = await BusCompany.findById(newBusInput["busOwner"])
        await createActivityLog(activity.companyId,activity.name,`Bus with plate number ${newBusInput["plateNumber"]} is Added`)
        return {...newBus.toObject(),busOwner:busOwnerOfBus.toObject()}
    },
    updateBus:async(_,{busID,BusInfo,activity})=>{
        if(BusInfo.driver){
            const detachFromOtherBus = await Bus.findOne({driver:BusInfo.driver})
            if(detachFromOtherBus){
                await Bus.findByIdAndUpdate(detachFromOtherBus._id,{$set:{driver:null}},{new:true})
            }
        }
        const updatedBus = await Bus.findByIdAndUpdate(busID,{$set:{...BusInfo}},{new:true})
        let driver = null
        if(BusInfo.driver){
            const updatedDriver = await Employee.findByIdAndUpdate(BusInfo.driver,{$set:{assignedTo:updatedBus._id}},{new:true})
            driver = updatedDriver.toObject()
        }
        await createActivityLog(activity.companyId,activity.name,`Bus with Plate Number ${updatedBus.plateNumber} has been updated`)
        return {...updatedBus.toObject(),driver}
    }
}

module.exports = {busQueries,busMutation}