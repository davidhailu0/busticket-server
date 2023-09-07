const Trip = require("../models/trip.model")
const Bus = require("../models/bus.model")
const Employee = require("../models/employee.model")
const BusCompany = require("../models/busCompany.model")
const User = require("../models/user.model")
const Ticket = require("../models/ticket.model")
const Schedule = require("../models/schedule.model")
const ActivityLog = require("../models/activityLog.model")

const testCreateTrip = async(req,res)=>{
    const date = new Date(new Date().toDateString())
    date.setDate(date.getDate()+1)
    const newTestBusCompany = new BusCompany({name:"Buna Bus",phoneNumber:"0912365478",email:"info@buna.et",password:"$2a$12$ggviljdGtq68i1xhCA1nFOpQNejDKbUVrzGId/dufginC.1Dszwo2",numberOfBuses:10,routes:["63988abc72ff91d21e9f2e0d"],role:"BUS COMPANY",logo:"BunaBusLogoFile.svg",license:"BunaBusLicenseFile.svg"})
    await newTestBusCompany.save()
    const newTestEmployeeDriver = new Employee({name:"TESTDRIVER",phoneNumber:"0999999999",address:"Addis Ababa",role:"DRIVER",suretyName:"Abebe",suretyPhone:"0922554411"})
    await newTestEmployeeDriver.save()
    const newTestBus = new Bus({plateNumber:"3aa45123",busBrand:"Volvo",busModel:"Camry",manufacturedYear:date.getTime(),VIN:"49afnjjvnjnfvjnfv123",driver:newTestEmployeeDriver._id,busOwner:newTestBusCompany._id})
    await newTestBus.save()
    const newTestTrip = new Trip({bus:newTestBus._id,departure:"Addis Ababa",destination:"Bahir Dar",departureDate:date.getTime(),reservedSeats:[],bookedSeats:[],departureTime:"4:00 AM",numberOfAvailableSeats:49})
    await newTestTrip.save()
    return res.json()
}

const testDeleteAllData = async(req,res)=>{
    await Trip.deleteMany()
    await Bus.deleteMany()
    await Employee.deleteMany()
    await BusCompany.deleteMany()
    await User.deleteMany()
    await Ticket.deleteMany()
    await Schedule.deleteMany()
    await ActivityLog.deleteMany()
    return res.json({})
}

const testDeleteBusData = async(req,res)=>{
    await Bus.deleteMany()
    return res.json({})
}

const testDeleteEmployeeData = async(req,res)=>{
    const {type} = req.params
    switch(type){
        case "ALL":
            await Employee.deleteMany()
            break;
        case "DRIVER":
            await Employee.deleteMany({role:"DRIVER"})
            break;
        case "DRIVERASSISTANT":
            await Employee.deleteMany({role:"DRIVER ASSISTANT"})
            break;
        case "TRIPMANAGER":
            await Employee.deleteMany({role:"TRIP MANAGER"})
    }
    return res.json({})
}

const testDeleteBusCompanyRoute = async(req,res)=>{
    const {id} = req.params
    await BusCompany.findByIdAndUpdate(id,{$set:{routes:[]}},{new:true})
    return res.json()
}

const testDeleteScheduleData = async(req,res)=>{
    await Schedule.deleteMany()
    return res.json()
}
module.exports = {testCreateTrip,testDeleteAllData,testDeleteBusData,testDeleteEmployeeData,testDeleteBusCompanyRoute,testDeleteScheduleData}