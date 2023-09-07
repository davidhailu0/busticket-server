const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const BusCompany = require("../../models/busCompany.model")
const Route = require("../../models/route.model")
const Ticket = require("../../models/ticket.model")
const Employee = require("../../models/employee.model")
const Trip = require("../../models/trip.model")
const Schedule = require("../../models/schedule.model")
const Bus = require("../../models/bus.model")
const getHashedPassword = require("../../utils/hashPassword")
const createActivityLog = require("../../utils/createActivityLog")
const {customAlphabet} = require("nanoid");
const sendEmail = require("../../services/nodeMailer")
const {io} = require("../../services/socketIO").getIO()
const {validateName} = require("../../utils/validate")

const fetchRoutes = async(busObj,attr)=>{
    const routeList = []
    if(busObj&&busObj[attr]){
        for(let rte of busObj[attr]){
            const foundRoute = await Route.findById(rte)
            if(foundRoute){
                routeList.push(foundRoute.toObject())
            }
        }
    }
    return routeList;
}

const sortYearData = (yearData)=>{
    let yearDataCount = [0,0,0,0,0,0,0,0,0,0,0,0]
    yearData.forEach(({_id,count})=>{
      yearDataCount[Number(_id)-1] = count
    })
    return yearDataCount
  }

  const findSubrouteForSubRoute = async(passedSubroute)=>{
    const allSubroutes = []
    for(let subRoute of passedSubroute){
        const foundedSubroute = await Route.findById(subRoute)
            if(foundedSubroute){
                const allSubroutesInSubRoute = []
                for(let eachin of foundedSubroute.subRoutes){
                    const foundedSubrouteInSubroute = await Route.findById(eachin)
                    allSubroutesInSubRoute.push(foundedSubrouteInSubroute.toObject())
                }
                allSubroutes.push({...foundedSubroute.toObject(),subRoutes:allSubroutesInSubRoute})
            }
    }
    return allSubroutes
}

const addToPrevious = (previous,newArray)=>{
    const newAddedValue = []
    for(let ind in previous){
        newAddedValue.push(previous[ind]+newArray[ind])
    }
    return newAddedValue
}

const busCompanyQueries = {
    busCompanies:(_,args)=>{
        return BusCompany.find()
    },
    busCompany:async(_,{id})=>{
        const foundBus = await BusCompany.findById(id)
        let availableRoutes = []
        availableRoutes = await fetchRoutes(foundBus,"routes")
        return {...foundBus.toObject(),routes:availableRoutes}
    },
    getBusCompanyData:async(_,{id})=>{
        let numberOfTrips = 0;
        let ticketsPurchasedToday = 0;
        let totalRevenue = 0;
        let lastYearSoldTicket = [0,0,0,0,0,0,0,0,0,0,0,0];
        let thisYearSoldTicket = [0,0,0,0,0,0,0,0,0,0,0,0];
        const busProviderBuses = await Bus.find({busOwner:id})
        const todayDate = new Date(new Date().toDateString())
        const tomorrowDate = new Date(todayDate.getTime())
        tomorrowDate.setDate(todayDate.getDate()+1)
        for(let bs of busProviderBuses){
            const trips = await Trip.find({bus:bs._id,departureDate:{$gte:todayDate.toISOString(),$lt:tomorrowDate.toISOString()}})
            numberOfTrips += trips.length 
            const ticketsPerBusToday = await Ticket.find({bus:bs._id,reservedAt:{$gte:todayDate.toISOString(),$lt:tomorrowDate.toISOString()}})
            ticketsPurchasedToday += ticketsPerBusToday.length
            const ticketPurchasedByBus = await Ticket.find({bus:bs._id,reservedAt:{$gte:todayDate.toISOString(),$lt:tomorrowDate.toISOString()}})
            for(let tcket of ticketPurchasedByBus){
                totalRevenue += tcket["price"]
            }
            const previousYearDataResult = await Ticket.aggregate([{$match:{$and:[{date:{$gte:new Date(`${new Date().getUTCFullYear()-1}-01-01`)}},{date:{$lte:new Date(`${new Date().getUTCFullYear()-1}-12-31`)}},{bus:{$eq:bs._id}}]}},{$group:{_id:{$dateToString:{"date":"$date","format":"%m"}},count:{$sum:1}}}])
            let previousYearDataSorted = sortYearData(previousYearDataResult)
            lastYearSoldTicket = addToPrevious(lastYearSoldTicket,previousYearDataSorted)
            const thisYearDataResult = await Ticket.aggregate([{$match:{$and:[{date:{$gte:new Date(`${new Date().getUTCFullYear()}-01-01`)}},{date:{$lte:new Date(`${new Date().getUTCFullYear()}-12-31`)}},{bus:{$eq:bs._id}}]}},{$group:{_id:{$dateToString:{"date":"$date","format":"%m"}},count:{$sum:1}}}])
            let thisYearSorted = sortYearData(thisYearDataResult)
            thisYearSoldTicket = addToPrevious(thisYearSoldTicket,thisYearSorted)
        }
        return {
            numberOfTrips,
            ticketsPurchased:ticketsPurchasedToday,
            totalRevenue:totalRevenue,
            lastYearSoldTicket:lastYearSoldTicket,
            thisYearSoldTicket:thisYearSoldTicket
        }
    },
    allRoutesOfBusCompany:async(_,{busCompanyId})=>{
        const foundedBusCompany = await BusCompany.findById(busCompanyId)
        const allRoutes = [];
        for(let rteID of foundedBusCompany.routes){
            const routeObj = await Route.findById(rteID)
            allRoutes.push({...routeObj.toObject(),subRoutes:findSubrouteForSubRoute(routeObj.subRoutes)})
        }
        return allRoutes 
    }
}




const busCompanyMutations = {
    getBusCompanyDataWithParam:async(_,{id,date})=>{
        let numberOfTrips = 0;
        let ticketsPurchased = 0;
        let totalRevenue = 0;
        const busProviderBuses = await Bus.find({busOwner:id})
        let filterDateObj = null
        if(validateName(date)){
            for(let bs of busProviderBuses){
                const trips = (await Trip.find({bus:bs._id})).filter(obj=>
                    new Date(obj.departureDate).toLocaleDateString('eng',{month:"long"})===date)
                numberOfTrips += trips.length 
                const ticketsPerBus = (await Ticket.find({bus:bs._id})).filter(obj=>
                    new Date(obj.reservedAt).toLocaleDateString('eng',{month:"long"})===date)
                ticketsPurchased += ticketsPerBus.length
                const ticketPurchasedByBus = (await Ticket.find({bus:bs._id})).filter(obj=>
                    new Date(obj.reservedAt).toLocaleDateString('eng',{month:"long"})===date)
                for(let tcket of ticketPurchasedByBus){
                    totalRevenue += tcket["price"]
                }
            }
            return {
                numberOfTrips,
                ticketsPurchased,
                totalRevenue:totalRevenue
            }
        }
        else if(date.length>4&&parseInt(date)!==NaN){
            const computedDate = new Date(new Date(parseInt(date)).toDateString())
            const computedNextDate = new Date(computedDate.getTime())
            computedNextDate.setDate(computedDate.getDate()+1)
            filterDateObj = {$gte:computedDate.toISOString(),$lt:computedNextDate.toISOString()}
        }
        else if(date.length===4){
            filterDateObj = {$gte:new Date(`${date}-01-01`),$lte:new Date(`${date}-12-31`)}
        }
        for(let bs of busProviderBuses){
            const trips = await Trip.find({bus:bs._id,departureDate:filterDateObj})
            numberOfTrips += trips.length 
            const ticketsPerBus = await Ticket.find({bus:bs._id,reservedAt:filterDateObj})
            ticketsPurchased += ticketsPerBus.length
            const ticketPurchasedByBus = await Ticket.find({bus:bs._id,reservedAt:filterDateObj})
            for(let tcket of ticketPurchasedByBus){
                totalRevenue += tcket["price"]
            }
        }
        return {
            numberOfTrips,
            ticketsPurchased,
            totalRevenue
        }
    },
    addBusCompany:async(_,{busCompany})=>{
        const {name,email,phoneNumber,password} = busCompany
        if(!name||!email||!phoneNumber||!password){
            return new Error("Please Enter all the required Fields")
        }
        const busCompanies = await BusCompany.find()
        const busCompanyFiltered = busCompanies.find((buscp)=>buscp.name.toLowerCase()===name.toLowerCase()||buscp.email===email||buscp.phoneNumber===phoneNumber)
        if(busCompanyFiltered){
            return new Error("This bus company have already been registered")
        }
        const hashedPassword = await getHashedPassword(password)
        const newBusCompany = new BusCompany({...busCompany,password:hashedPassword})
        await newBusCompany.save()
        const token = jwt.sign({...newBusCompany.toObject(),accountName:"ADMIN"},process.env.TOKEN_KEY)
        createActivityLog(newBusCompany._id,"Admin",`${name} Signup for MyBus System`)
        return {...newBusCompany.toObject(),token}
    },
    loginBusCompany:async(_,{loginInfo})=>{
        const { email,password} = loginInfo
        if(!email||!password){
            return Error("Invalid Email or Password")
        }
        let busCompany = await BusCompany.findOne({email})
        let ROLE = "BUS COMPANY"
        let NAME = "ADMIN"
        let employeeId = null
        let phoneNumber = busCompany&&busCompany.phoneNumber?busCompany.phoneNumber:null;
        if(!busCompany){
            busCompany = await Employee.findOne({phoneNumber:email,role:"TRIP MANAGER"})
            if(!busCompany){
                return new Error("You are not registered")
            }
            phoneNumber = busCompany.phoneNumber[0]
            NAME = busCompany.name
            employeeId = busCompany._id
        }
        const validPass = await bcrypt.compare(password,busCompany.password)
        if(busCompany.busCompany){
            busCompany = await BusCompany.findById(busCompany.busCompany.toString())
            ROLE = "TRIP MANAGER"
        }
        if(!validPass){
            return new Error("Invalid username or password")
        }
        const token = jwt.sign({...busCompany.toObject(),role:ROLE,phoneNumber,accountName:NAME,employeeId},process.env.TOKEN_KEY)
        createActivityLog(busCompany._id,NAME,`${NAME} logged into MyBus System`)
        return {...busCompany.toObject(),role:ROLE,phoneNumber,token}
    },
    updateBusCompany:async(_,{id,busCompany,activity})=>{
        const busCompanyfound = await BusCompany.findById(id)
        if(busCompany["password"]===""){
            delete busCompany["password"]
        }
        if(!busCompanyfound){
            return new Error("Bus Not Found")
        }
        let availableRoutes = [...busCompanyfound.routes]
        availableRoutes = availableRoutes.map(trp=>trp.toString())
        if(busCompany&&busCompany["routes"]){
            availableRoutes = [...busCompany["routes"]]
        }
        if(busCompanyfound.routes&&busCompanyfound.routes.length>0&&busCompany.routes){
            const removedRoutes = busCompanyfound.routes.filter(id=>!busCompany.routes.includes(id.toString()))
            for(let routeID of removedRoutes){
                const routeFound = await Route.findById(routeID)
                await Trip.deleteMany({departure:routeFound.departure,destination:routeFound.destination})
                await Trip.deleteMany({departure:routeFound.destination,destination:routeFound.departure})
                await Schedule.deleteMany({departure:routeFound.departure,destination:routeFound.destination})
                await Schedule.deleteMany({departure:routeFound.destination,destination:routeFound.departure})   
            }
        }
        const updatedBusCompany = await BusCompany.findByIdAndUpdate(id,{$set:{...busCompany,routes:availableRoutes}},{new:true})
        const token = jwt.sign({...updatedBusCompany},process.env.TOKEN_KEY)
        await createActivityLog(activity.companyId,activity.name,`${activity.name} updated Bus Company Info`)
        return {...updatedBusCompany.toObject(),routes:fetchRoutes(updatedBusCompany,"routes"),token}
    },
    forgotPasswordBusCompany:async(_,{credential})=>{
        let foundedBusCompany = await BusCompany.findOne({$or:[{phoneNumber:credential},{email:credential}]})
        let employeeName = "Admin"
        const OTP = customAlphabet("0123456789",6)()
        if(!foundedBusCompany){
            foundedBusCompany = await Employee.findOne({phoneNumber:credential,role:"TRIP MANAGER"})
            if(!foundedBusCompany){
                return new Error("The Phone Number is not found")
            }
            employeeName = foundedBusCompany.name
            await Employee.findByIdAndUpdate(foundedBusCompany._id,{$set:{OTP}},{new:true})
            io.emit("SEND PHONE OTP",JSON.stringify({phoneNumber:foundedBusCompany['phoneNumber'][0],OTP}))
            const _id = foundedBusCompany._id
            foundedBusCompany = await BusCompany.findById(foundedBusCompany.busCompany)
            await createActivityLog(foundedBusCompany._id,employeeName,`${employeeName} sent an OTP to reset the Password`)
            return {...foundedBusCompany.toObject(),OTP,role:"TRIP MANAGER",_id}
        }
        await sendEmail(foundedBusCompany['email'],`Your OTP is ${OTP}`, `Hello There, \nAs Your OTP for resetting your password is ${OTP}.\nThank You for using MyBus`,`<p>Hello There</p> <h4>Your OTP for resetting your password is ${OTP}</h4> <p>Thank You for using MyBus</p>`)
        await BusCompany.findByIdAndUpdate(foundedBusCompany._id,{$set:{OTP}},{new:true})
        await createActivityLog(foundedBusCompany._id,employeeName,`${employeeName} sent an OTP to reset the Password`)
        return {...foundedBusCompany.toObject(),OTP}
    },
    checkOTPBusCompany:async(_,{companyID,OTP})=>{
        let busCompany = await BusCompany.findById(companyID)
        if(busCompany&&busCompany.OTP===OTP&&busCompany.OTP!==""){
            await BusCompany.findByIdAndUpdate(companyID,{$set:{OTP:""}},{new:true})
            await createActivityLog(busCompany._id,"Admin",`Admin Changed the password`)
            return "OTP MATCH"
        }
        else if(!busCompany){
            const employee = await Employee.findById(companyID)
            if(employee.OTP===OTP&&employee.OTP!==""){
                await Employee.findByIdAndUpdate(companyID,{$set:{OTP:""}},{new:true})
                return "OTP MATCH"
            }
            return new Error("Incorrect OTP")
        }
        return new Error("Incorrect OTP")
    },
    changePasswordBusCompany:async(_,{userID,newPassword})=>{
        const hashedPassword = await getHashedPassword(newPassword);
        let ROLE = "BUS COMPANY"
        let NAME = "ADMIN"
        let employeeId = null
        let busCompany = await BusCompany.findById(userID)
        let phoneNumber = null;
        if(busCompany){
            await BusCompany.findByIdAndUpdate(userID,{$set:{password:hashedPassword}},{new:true})
            busCompany = await BusCompany.findById(userID)
            employeeId = busCompany._id
            phoneNumber = busCompany.phoneNumber
            await createActivityLog(busCompany._id,"Admin",`Admin Changed the password`)
        }
        else{
            await Employee.findByIdAndUpdate(userID,{$set:{password:hashedPassword}},{new:true})
            const emp = await Employee.findById(userID)
            userID = emp.busCompany
            const busComp = await BusCompany.findById(emp.busCompany)
            ROLE = "TRIP MANAGER"
            NAME = busComp.name
            phoneNumber = emp.phoneNumber[0]
            busCompany = {...busComp.toObject(),role:"TRIP MANAGER",_id:emp._id}
            employeeId = emp._id
            await createActivityLog(emp.busCompany,emp.name,`${emp.name} Changed the password`)
        }
        const user = await BusCompany.findById(userID)
        const token = jwt.sign({...user.toObject(),role:ROLE,phoneNumber,accountName:NAME,employeeId},process.env.TOKEN_KEY)
        return {...user.toObject(),token}
    },
    deleteBusCompany:async(_,{id})=>{
        return await Bus.findByIdAndUpdate(id,{$set:{active:false}},{new:true})
    }
}

module.exports = {busCompanyQueries,busCompanyMutations}