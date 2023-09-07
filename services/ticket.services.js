var xid = require("xid");
const Ticket = require("../models/ticket.model")

// const sendOTP = (req,res)=>{
//    const {to} = req.body
//    const OTPNumber = `${(Math.random()*10 +1)}${(Math.random()*10+1)}${(Math.random()*10+1)}${(Math.random()*10+1)}`
//    const html = `<h2>Hello ${to.substring(0,to.indexOf("@"))}</h2> <p>We want to verify that you are a real user. Please enter ${OTPNumber} in the textfield modal</`
//    sendEmail(to,"Confirm Your Purchase of the ticket",`Your OTP is ${OTPNumber}`,html,res)
// }

const buyTicket = async(req,res)=>{
    const {starting_place,destination,date,price} = req.body
    const newTicketObject = {starting_place,destination,date,price,_id:xid.generateId().toString().substring(0,5)}
    try{
        const newTicket = new Ticket(newTicketObject)
        const savedTicket = await newTicket.save();
        return res.status(201).json({"status":"success","data":savedTicket})
    }
    catch(e){
        return res.status(500).json({"status":"error","message":e.message})
    }
}

const getTicketById = async(req,res)=>{
    const {ticketId} = req.params
    const foundedTicket = await Ticket.findById(ticketId)
    if(foundedTicket){
       return res.status(200).json({"status":"success","data":foundedTicket})
    }
    return res.status(200).json({"status":"success","data":"No Ticket Found"})
}

const updateTicket = (req,res)=>{

}

const cancelTicketRequest = (req,res)=>{

}

module.exports = {getTicketById,buyTicket,updateTicket,cancelTicketRequest}