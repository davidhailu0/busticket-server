const multer = require("multer")
const authRouter = require('express').Router()
const {registerCustomer,loginCustomer, registerBus, loginBus,loginAdmin,deleteTestData} = require("../services/auth.service")
const storage = multer.diskStorage({destination:(req,file,cb)=>{
    cb(null,'./uploads')},filename:(req,file,cb)=>{
        cb(null,`${file.originalname}`)}})
const uploads = multer({storage:storage}) 
authRouter.post('/customer/signup',registerCustomer)
authRouter.post("/bus/signup",[uploads.single("file")],registerBus)
authRouter.post("/customer/login",loginCustomer)
authRouter.post("/bus/login",loginBus)
authRouter.post("/admin/login",loginAdmin)
authRouter.delete("/testData",deleteTestData)

module.exports = authRouter;