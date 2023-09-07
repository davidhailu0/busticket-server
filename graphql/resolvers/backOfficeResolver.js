const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const BackOffice = require("../../models/backOffice.model")
const getHashedPassword = require("../../utils/hashPassword")
const createActivityLog = require("../../utils/createActivityLog")
const BusCompany = require("../../models/busCompany.model")
const Ticket = require("../../models/ticket.model")
const User = require("../../models/user.model")
const CallCenter = require("../../models/callCenter.model")
const Bank = require("../../models/bank.model")

const BackOfficeQueries = {
    backOfficeData:async()=>{
        const numberOfBusCompanies = (await BusCompany.find()).length
        const numberOfSoldTickets = (await Ticket.find({status:"BOOKED"})).length
        const numberOfCustomers = (await User.find({role:"TICKET PURCHASER"})).length
        const numberOfCallOperators = (await CallCenter.find()).length
        const numberOfBanks = (await Bank.find()).length
        return {numberOfBusCompanies,numberOfSoldTickets,numberOfCustomers,numberOfCallOperators,numberOfBanks}
    },
    backOfficeEmployee:async(_,{id})=>{
        const employee = await BackOffice.findById(id)
        return employee.toObject()
    },
    backOfficeEmployees:async()=>{
        const backOfficeEmployees = await BackOffice.find()
        return backOfficeEmployees;
    }
}

const BackOfficeMutations = {
    loginBackOffice:async(_,{backOfficeInfo})=>{
        const {username,password} = backOfficeInfo;
        if(!username||!password){
            return Error("Invalid PhoneNumber or Password")
        }
        const admin = await BackOffice.findOne({username})
        if(!admin){
            return new Error("You are not registered")
        }
        const validPass = await bcrypt.compare(password,admin.password)
        if(!validPass){
            return new Error("Invalid username or password")
        }
        const token = jwt.sign({...admin.toObject()},process.env.TOKEN_KEY)
        await createActivityLog("MYBUS",username,`${username} logged in to MyBus Company`)
        return {...admin.toObject(),token}
    },
    addAdmin:async(_,{adminInfo,activity})=>{
        const {username,password} = adminInfo;
            if(!username||!password){
                return new Error("Please Enter the required inputs")
            }
            const checkUser = await BackOffice.findOne({username})
            if(checkUser){
                return new Error("Username is already taken")
            }
            else{
                const hashedPassword = await getHashedPassword(password)
                const newAdmin = new BackOffice({...adminInfo,password:hashedPassword})
                await newAdmin.save()
                const token = jwt.sign({...newAdmin.toObject()},process.env.TOKEN_KEY)
                await createActivityLog("MYBUS",activity.name,`${activity.name} added ${username} Admin`)
                return {...newAdmin.toObject(),token}
            }
    },
    AddCallCenter:async(_,{callCenterInfo,activity})=>{
        const hashedPassword = await getHashedPassword(callCenterInfo.password)
        const newCallCenter = new CallCenter({...callCenterInfo,password:hashedPassword})
        await newCallCenter.save()
        await createActivityLog("MYBUS",activity.name,`${callCenterInfo.name} added as Call Center Operator`)
        return {...newCallCenter.toObject()}
    },
    updateAdmin:async(_,{id,adminInfo,activity})=>{
        let updatedAdmin;
        if(adminInfo.password!==""){
            delete adminInfo.password
            updatedAdmin = await BackOffice.findByIdAndUpdate(id,{$set:{...adminInfo}},{new:true})
        }
        else{
            const hashedPassword = await getHashedPassword(adminInfo.password)
            updatedAdmin = await BackOffice.findByIdAndUpdate(id,{$set:{...adminInfo,password:hashedPassword}},{new:true})
        }
        await createActivityLog("MYBUS",updatedAdmin.username,`${updatedAdmin.username} Updated it's Account`)
        return updatedAdmin.toObject()
    }
}


module.exports = {BackOfficeMutations,BackOfficeQueries}

