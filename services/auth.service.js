const fs = require("fs")
const path = require("path")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Customer = require("../models/customer.model")
const Bus = require("../models/bus.model")
const getHashedPassword = require("../utils/hashPassword")


const loginUser = async(req,res,role)=>{
    const {username,password} = req.body;
    if(!username||!password){
        return res.status(404).json({"status":"error","message":"Invalid username or password"})
    }
    const customers = await Customer.find({role})
    const foundCustomer = customers.find((user)=>(user.email&&user.email.toLowerCase()===username.toLowerCase())||user.phoneNumber===username)
    if(!foundCustomer){
        return res.status(404).json({"status":"error","message":"You are not registered"})
    }
    const validPass = await bcrypt.compare(password,foundCustomer.password)
    if(!validPass){
        return res.status(400).json({"status":"error","message":"Invalid username or password"})
    }
    const token = jwt.sign({...foundCustomer},process.env.TOKEN_KEY)
    return res.header("token", token).status(200).json({"status":"success",token})
}

const registerCustomer = async(req,res)=>{
    const {email,phoneNumber,password} = req.body;
    if(!email||!phoneNumber||!password){
        return res.status(400).json({"status":"error","message":"You have entered Invalid data"})
    }
    req.body.role = "CUSTOMER"
    const allCustomers = await Customer.find()
    const checkCustomers = allCustomers.find((user)=>(email&&user.email.toLowerCase()===email.toLowerCase())||user.phoneNumber===phoneNumber)
    if(checkCustomers){
        return res.status(400).json({"status":"error","message":"The email or phone number is used"})
    }
    const hashedPassword = await getHashedPassword(password)
    const newCustomer = new Customer({...req.body,password:hashedPassword})
    await newCustomer.save()
    const newCustomerJson = newCustomer.toJSON()
    delete newCustomerJson["password"]
    return res.status(201).json({"status":"success","data":newCustomerJson})
}


const loginCustomer = async(req,res)=>{
    return await loginUser(req,res,"CUSTOMER")
}

const registerBus = async(req,res)=>{
    const {name,email,phoneNumber,password} = req.body
    if(!name||!email||!phoneNumber||!password){
        return res.status(400).json({"status":"error","message":"Invalid Data has been entered"})
    }
    const busCompany = await Bus.find()
    const busCompanyFiltered = busCompany.find((bus)=>bus.name.toLowerCase()===name.toLowerCase()||bus.email===email||bus.phoneNumber===phoneNumber)
    if(busCompanyFiltered){
        fs.unlinkSync(path.resolve(__dirname + '/../uploads/' + req.file.filename))
        return res.status(400).json({"status":"error","message":"This bus company have already been registered"})
    }
    const hashedPassword = await getHashedPassword(password)
    const newBusCompany = new Bus({...req.body,password:hashedPassword,logo:req.file.filename})
    await newBusCompany.save()
    const newBusCompanyJson = newBusCompany.toJSON()
    delete newBusCompanyJson["password"]
    return res.status(201).json({"status":"success","data":newBusCompanyJson})
}

const loginBus = async(req,res)=>{
    const {name,password} = req.body
    if(!name||!password){
        return res.status(404).json({"status":"error","message":"Please Enter a valid name and password"})
    }
    const busCompanies = await Bus.find()
    const foundBusCompany = busCompanies.find((bus)=>bus.name.toLowerCase()===name.toLowerCase())
    if(!foundBusCompany){
        return res.status(404).json({"status":"error","message":"There is no bus registered with this name"})
    }
    const validPass = await bcrypt.compare(password,foundBusCompany.password)
    if(!validPass){
        return res.status(400).json({"status":"error","message":"Invalid name or password"})
    }
    const token = jwt.sign({...foundBusCompany},process.env.TOKEN_KEY)
    return res.status(200).json({"status":"success",token})
}

const loginAdmin = async(req,res)=>{
    return await loginUser(req,res,"ADMIN")
}

const deleteTestData = async(req,res)=>{
    const {email} = req.query
    await Customer.deleteOne({email})
    await Bus.deleteOne({email})
    return res.json({})
}

module.exports = {registerCustomer,loginCustomer,registerBus,loginBus,loginAdmin,deleteTestData}
