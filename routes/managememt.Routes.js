const Router = require("express").Router()
const multer = require('multer')
const {getDashBoardData,getAllCustomer,importFile,exportFile,getAdminInfo,changePassword,changeProfileInfo} = require("../services/management.service")
const storage = multer.diskStorage({destination:(req,file,cb)=>{
    cb(null,'./uploads')},filename:(req,file,cb)=>{
        cb(null,file.fieldname+".xlsx")}})
const uploads = multer({storage:storage}) 

Router.get("/",getDashBoardData)
Router.get("/allCustomers",getAllCustomer)
Router.get("/getCustomerCSV",exportFile)
Router.get("/getInfo",getAdminInfo)
Router.post("/uploadFile",[uploads.single("file")],importFile)
Router.patch("/updateProfile",changeProfileInfo)
Router.patch("/updatePassword",changePassword)

module.exports = Router
