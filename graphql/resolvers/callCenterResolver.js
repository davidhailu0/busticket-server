const Ticket = require("../../models/ticket.model")
const CallCenter = require("../../models/callCenter.model")
const User = require("../../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const {customAlphabet} = require("nanoid");
const createActivityLog = require("../../utils/createActivityLog")
const getHashedPassword = require("../../utils/hashPassword")
const {io} = require("../../services/socketIO").getIO()


const mapToName = async(resultArr)=>{
    let returnArray = []
    console.log(resultArr)
    for(let obj of resultArr){
        console.log(obj.ticketPurchaser)
        let ticketPurchaserInfo = await User.findById(obj.ticketPurchaser)
        console.log(ticketPurchaserInfo)
        returnArray.push({...obj.toObject(),ticketPurchaser:{...ticketPurchaserInfo.toObject()}})
    }
    return returnArray
}

const computeTicketInfoAndReturn = async(callCenterObj)=>{
    const dateNow = new Date(new Date().toDateString())
    const dateTomorrow = new Date()
    dateTomorrow.setDate(dateTomorrow.getDate()+1)
    let totalCallsReceived;
    let allReceivedCallsSinceRegistration = 0;
    if(callCenterObj){
            totalCallsReceived = callCenterObj.calls.find((obj)=>obj.date.toISOString()===dateNow.toISOString())
        if(!totalCallsReceived){
            totalCallsReceived = 0
        }
        else{
            totalCallsReceived = totalCallsReceived.calls
        }
        allReceivedCallsSinceRegistration = callCenterObj.calls.reduce((prev,curr)=>{
            return prev += curr.calls
        },0)
    }
    const successfullyBookedTicketsCount = (await (Ticket.find({status:"BOOKED",bookedAt:{$gte:dateNow.getTime(),$lt:dateTomorrow.getTime()}}))).length
    const pendingTicketsCount = (await (Ticket.find({status:"RESERVED",reservedAt:{$gte:dateNow.getTime(),$lt:dateTomorrow.getTime()}}))).length
    const cancelledTicketsCount = (await (Ticket.find({status:"TERMINATED",terminatedAt:{$gte:dateNow.getTime(),$lt:dateTomorrow.getTime()}}))).length
    
    let resultArr = await Ticket.find({status:"BOOKED",bookedAt:{$gte:dateNow.getTime(),$lt:dateTomorrow.getTime()}})
    let successfullyBookedTickets = await mapToName(resultArr)
    resultArr = await Ticket.find({status:"RESERVED",reservedAt:{$gte:dateNow.getTime(),$lt:dateTomorrow.getTime()}})
    let pendingTickets = await mapToName(resultArr)
    resultArr = await Ticket.find({status:"TERMINATED",terminatedAt:{$gte:dateNow.getTime(),$lt:dateTomorrow.getTime()}})
    let cancelledTickets = await mapToName(resultArr)
    resultArr = await Ticket.find({reservedAt:{$gte:dateNow.getTime(),$lt:dateTomorrow.getTime()}})
    let allReceivedCall = await mapToName(resultArr)
    if(callCenterObj){
        return {...callCenterObj.toObject(),
            totalCallsReceived,
            successfullyBookedTicketsCount,
            pendingTicketsCount,
            cancelledTicketsCount,
            successfullyBookedTickets,
            pendingTickets,
            cancelledTickets,
            allReceivedCall,
            allReceivedCallsSinceRegistration
        }
    }
    return {
        successfullyBookedTicketsCount,
        pendingTicketsCount,
        cancelledTicketsCount,
        successfullyBookedTickets,
        pendingTickets,
        cancelledTickets,
        allReceivedCall,
        allReceivedCallsSinceRegistration
    }
}


const callCenterQueries = {
    getAllCallCenterData:async(_,{callCenterId})=>{
        const callCenter = await CallCenter.findById(callCenterId)
        return computeTicketInfoAndReturn(callCenter)
    },
    getAllCallCenters:async()=>{
        const allCallCenters = await CallCenter.find();
        let modifiedCallCentersInfo = allCallCenters.map(cllCnt=>computeTicketInfoAndReturn(cllCnt))
        return modifiedCallCentersInfo;
    }
}

const callCenterMutations = {
    updateCallsInfo:async(_,{callCenterId})=>{
        const dateNow = new Date(new Date().toDateString())
        const callCenter = await CallCenter.findById(callCenterId)
        const callsReceivedTodayIndex = callCenter.calls.findIndex(obj=>obj.date.toISOString()===dateNow.toISOString());
        let updatedCallCenterInfo;
        if(callsReceivedTodayIndex>=0){
            const deletedCalls = callCenter.calls.splice(callsReceivedTodayIndex,1)
            updatedCallCenterInfo = await CallCenter.findByIdAndUpdate(callCenterId,{$set:{calls:[...callCenter.calls,{calls:deletedCalls[0].calls+1,date:dateNow.toISOString()}]}},{new:true})
        }
        else{
            updatedCallCenterInfo = await CallCenter.findByIdAndUpdate(callCenterId,{$set:{calls:[{calls:1,date:dateNow.toISOString()}]}},{new:true})
        }
        createActivityLog("MYBUS",callCenter.name,`${callCenter.name} has reserved a ticket`)
        return computeTicketInfoAndReturn(updatedCallCenterInfo)
    },
    updateCallCenterInfo:async(_,{callCenterId,updateInfo})=>{
        if(updateInfo["password"]!=="Unchanged"){
            const hashedPassword = await getHashedPassword(updateInfo["password"])
            const updatedCallCenter = await CallCenter.findByIdAndUpdate(callCenterId,{$set:{...updateInfo,password:hashedPassword}},{new:true});
            return updatedCallCenter.toObject()
        }
        delete updateInfo.password
        const updatedCallCenter = await CallCenter.findByIdAndUpdate(callCenterId,{$set:{...updateInfo}},{new:true});
        await createActivityLog("MYBUS",updatedCallCenter.name,`${updatedCallCenter.name} information has been updated`)
        return updatedCallCenter.toObject()
    },
    loginCallCenter:async(_,{credentialInfo})=>{
        const {phoneNumber,password} = credentialInfo;
        if(!phoneNumber||!password){
            return Error("Invalid PhoneNumber or Password")
        }
        const callCenter = await CallCenter.findOne({phoneNumber})
        if(!callCenter){
            return new Error("You are not registered")
        }
        const validPass = await bcrypt.compare(password,callCenter.password)
        if(!validPass){
            return new Error("Invalid username or password")
        }
        const token = jwt.sign({...callCenter.toObject()},process.env.TOKEN_KEY)
        createActivityLog("MYBUS",callCenter.name,`${callCenter.name} has logged into the system`)
        return {...callCenter.toObject(),token}
    },
    forgotPasswordCallCenter:async(_,{phoneNumber})=>{
        const foundedCallCenter = await CallCenter.findOne({phoneNumber})
        if(!foundedCallCenter){
            return new Error("The Phone Number is not found")
        }
        const OTP = customAlphabet("0123456789",6)()
        await CallCenter.findByIdAndUpdate(foundedCallCenter._id,{$set:{OTP}},{new:true})
        createActivityLog("MYBUS",foundedCallCenter.name,`${foundedCallCenter.name} sent an OTP to reset password`)
        io.emit("SEND PHONE OTP",JSON.stringify({phoneNumber,OTP}))
        return {...foundedCallCenter.toObject(),OTP}
    },
    checkOTPCallCenter:async(_,{userID,OTP})=>{
        const foundedUser = await CallCenter.findById(userID)
        if(foundedUser.OTP===OTP&&foundedUser.OTP!==""){
            await CallCenter.findByIdAndUpdate(userID,{$set:{OTP:""}},{new:true})
            return "OTP MATCH"
        }
        return new Error("Incorrect OTP")
    },
    changePasswordCallCenter:async(_,{userID,newPassword})=>{
        const hashedPassword = await getHashedPassword(newPassword);
        await CallCenter.findByIdAndUpdate(userID,{$set:{password:hashedPassword}},{new:true})
        const user = await CallCenter.findById(userID)
        const token = jwt.sign({...user.toObject()},process.env.TOKEN_KEY)
        createActivityLog("MYBUS",user.name,`${user.name} changed their password`)
        return {...user.toObject(),token}
    },
}

module.exports = {callCenterQueries,callCenterMutations,computeTicketInfoAndReturn};