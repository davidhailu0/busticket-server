const Router = require("express").Router()
const {getTicketById,buyTicket} = require("../services/ticket.services")
const authMiddleware = require("../middlewares/auth.middleware")

Router.get("/:ticketId",[authMiddleware],getTicketById)
Router.post("/buyTicket",buyTicket)
// Router.put("/updateTicket",)
// Router.delete("/cancelTicket",)


module.exports = Router