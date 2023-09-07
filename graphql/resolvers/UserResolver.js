const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User= require("../../models/user.model")
const Trip = require("../../models/trip.model")
const Ticket = require("../../models/ticket.model")
const getHashedPassword = require("../../utils/hashPassword")
const {io} = require("../../services/socketIO").getIO()
const {customAlphabet} = require("nanoid");

const userQueries = {
    users: (_,args)=>{
        return User.find()
    },
    user:(_,{id})=>{
        return User.findById(id)
    },
    bookedPassengers:async(_,{tripId})=>{
        const foundTrip = await Trip.findById(tripId)
        const foundTickets = await Ticket.find({bus:foundTrip.bus,departure:foundTrip.departure,destination:foundTrip.destination,date:foundTrip.departureDate,status:"RESERVED"})
        const allPassengers = []
        for(let ticket of foundTickets){
            const passenger = await User.findById(ticket.passengerId)
            allPassengers.push({...passenger.toObject(),pickupLocation:ticket.pickupLocation})
        }
        return allPassengers
    },
    userFile:(_,args)=>{

    }
}

const userMutations = {
    registerUsers:async(_,{users})=>{
        const usersArray = []
        for(let usr of users){
            const {name,phoneNumber} = usr;
            if(!phoneNumber||!name){
                return new Error("Please Enter the required inputs")
            }
            let checkUser = await User.findOne({phoneNumber})
            if(checkUser){
                if(usr["role"]){
                    checkUser = await User.findOneAndUpdate({phoneNumber},{$set:{role:usr["role"]}},{new:true})
                }
                usersArray.push({...checkUser.toObject(),name})
            }
            else{
                const newUser = new User({...usr})
                await newUser.save()
                usersArray.push(newUser.toObject());
            }
        }
        return usersArray
    },
    signupUser:async(_,{user})=>{
        const {name,password,phoneNumber} = user;
            if(!phoneNumber||!password||!name){
                return new Error("Please Enter the required inputs")
            }
            const checkUser = await User.findOne({phoneNumber})
            if(checkUser&&checkUser.password){
                return new Error("The Phone Number is Used")
            }
            else if(checkUser&&checkUser.role==="PASSENGER"){
                const hashedPassword = await getHashedPassword(password)
                const token = jwt.sign({...checkUser.toObject(),role:"TICKET PURCHASER"},process.env.TOKEN_KEY)
                const user = await User.findByIdAndUpdate(checkUser._id,{$set:{password:hashedPassword,role:"TICKET PURCHASER"}},{new:true})
                return {...user.toObject(),token}
            }
            else{
                const hashedPassword = await getHashedPassword(password)
                const newUser = new User({...user,role:"TICKET PURCHASER",password:hashedPassword})
                await newUser.save()
                const token = jwt.sign({...newUser.toObject()},process.env.TOKEN_KEY)
                return {...newUser.toObject(),token}
            }
    },
    login:async(_,{credential})=>{
        const {phoneNumber,password} = credential;
        if(!phoneNumber||!password){
            return Error("Invalid PhoneNumber or Password")
        }
        const user = await User.findOne({phoneNumber})
        if(!user||!user.password){
            return new Error("You are not registered")
        }
        const validPass = await bcrypt.compare(password,user.password)
        if(!validPass){
            return new Error("Invalid Phone Number or Password")
        }
        const token = jwt.sign({...user.toObject()},process.env.TOKEN_KEY)
        return {...user.toObject(),token}
    },
    forgotPasswordUser:async(_,{phoneNumber})=>{
        const foundedUser = await User.findOne({phoneNumber})
        if(!foundedUser){
            return new Error("The Phone Number is not found")
        }
        const OTP = customAlphabet("0123456789",6)()
        await User.findByIdAndUpdate(foundedUser._id,{$set:{OTP}},{new:true})
        io.emit("SEND PHONE OTP",JSON.stringify({phoneNumber,OTP}))
        return {...foundedUser.toObject(),OTP}
    },
    checkOTPUser:async(_,{userID,OTP})=>{
        const foundedUser = await User.findById(userID)
        if(foundedUser.OTP===OTP&&foundedUser.OTP!==""){
            await User.findByIdAndUpdate(userID,{$set:{OTP:""}},{new:true})
            return "OTP MATCH"
        }
        return new Error("Incorrect OTP")
    },
    changePasswordUser:async(_,{userID,newPassword})=>{
        const hashedPassword = await getHashedPassword(newPassword);
        await User.findByIdAndUpdate(userID,{$set:{password:hashedPassword}},{new:true})
        const user = await User.findById(userID)
        const token = jwt.sign({...user.toObject()},process.env.TOKEN_KEY)
        return {...user.toObject(),token}
    },
    registerUserLookingForTrip:async(_,{user})=>{
      const {tripDate} = user
      const date = new Date(new Date(parseInt(tripDate)).toDateString())
      const usrLookingForTrip = new User({...user,tripDate:date.getTime()})
      await usrLookingForTrip.save();
      return usrLookingForTrip.toObject();
    },
    updateUser:async(_,{id,user})=>{
        return await User.findByIdAndUpdate(id,{$set:{...user}},{new:true})
    },
    deleteUser:async(_,{id})=>{
        return await User.findByIdAndUpdate(id,{$set:{active:false}})
    }
}

module.exports = {userQueries,userMutations}