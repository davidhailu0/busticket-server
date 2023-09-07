const router = require("express").Router()
const {addTrip,getSearchedTrips,updateTrip, deleteTrip} = require('../services/trip.services')
const authMiddleware = require("../middlewares/auth.middleware")

router.get("/",getSearchedTrips)
router.post("/addTrip",[authMiddleware],addTrip)
router.put("/updateTrip",[authMiddleware],updateTrip)
router.delete("/deleteTrip",[authMiddleware],deleteTrip)

module.exports = router