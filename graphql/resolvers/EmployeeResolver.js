const Employee = require("../../models/employee.model")
const Bus = require("../../models/bus.model")
const createActivityLog = require("../../utils/createActivityLog")
const getHashedPassword = require("../../utils/hashPassword")

const employeeQueries = {
    allEmployeeOfTheBus:async(_,{busCompanyId})=>{
       const allEmployees = await Employee.find({busCompany:busCompanyId})
       const employeesToObject = []
       for(let emp of allEmployees){
         const employeesBus = await Bus.findOne({driver:emp["_id"]})
         if(employeesBus&&employeesBus["plateNumber"]){
            employeesToObject.push({...emp.toObject(),plateNumber:employeesBus["plateNumber"]})
         }
         else{
            employeesToObject.push({...emp.toObject()})
         }
       }
       return employeesToObject;
    },
    employee:async(_,{employeeId})=>{
        const foundedEmployee = await Employee.findById(employeeId)
        return foundedEmployee.toObject()
    },
    allDrivers:async(_,{busCompanyID})=>{
        const allDrivers = await Employee.find({role:"DRIVER",busCompany:busCompanyID})
        const allDriversConverted = [];
        for(let driver of allDrivers){
            let tempAssignedTo = null
            if(driver.assignedTo){
                tempAssignedTo = await Bus.findById(driver.assignedTo)
                tempAssignedTo = tempAssignedTo.toObject()
            }
            allDriversConverted.push({...driver.toObject(),assignedTo:tempAssignedTo})
        }
        return allDriversConverted
    },
    allDriverAssistants:async(_,{busCompanyID})=>{
        const allDriverAssistant = await Employee.find({role:"DRIVER ASSISTANT",busCompany:busCompanyID})
        const allDriverAssistantConverted = [];
        for(let driverAssistant of allDriverAssistant){
            allDriverAssistantConverted.push(driverAssistant.toObject())
        }
        return allDriverAssistantConverted
    }
}

const employeeMutations = {
    addEmployee:async(_,{employeeInfo,activity})=>{
        let newEmployee = new Employee({...employeeInfo});
        const checkPhoneNumber = await Employee.find({phoneNumber:employeeInfo.phoneNumber})
        if(checkPhoneNumber.length>0){
            return Error("Phone Number is already registered")
        }
        if(employeeInfo.password){
            const hashedPassword = await getHashedPassword(employeeInfo["password"])
            newEmployee = new Employee({...employeeInfo,password:hashedPassword})
        }
        await newEmployee.save()
        await createActivityLog(activity.companyId,activity.name,`${newEmployee.name} added to the Company Staff`)
        return newEmployee.toObject()
    },
    updateEmployee:async(_,{employeeId,employeeInfo,activity})=>{
        if(employeeInfo["password"]!=="Unchanged"){
            const hashedPassword = await getHashedPassword(employeeInfo["password"])
            const updatedEmployee = await Employee.findByIdAndUpdate(employeeId,{$set:{...employeeInfo,password:hashedPassword}},{new:true});
            return updatedEmployee.toObject()
        }
        delete employeeInfo.password
        const updatedEmployee = await Employee.findByIdAndUpdate(employeeId,{$set:{...employeeInfo}},{new:true});
        await createActivityLog(activity.companyId,activity.name,`${updatedEmployee.name} information has been updated`)
        return updatedEmployee.toObject()
    }
}

module.exports = {employeeQueries,employeeMutations}