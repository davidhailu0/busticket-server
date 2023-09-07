const path = require("path")
const multer = require("multer")
const storage = multer.diskStorage({destination:(req,file,cb)=>{
    cb(null,'./uploads')},filename:(req,file,cb)=>{
        cb(null,req.headers['busprovider']+file.fieldname+path.extname(file.originalname))}})


const storage2 = multer.diskStorage({destination:(req,file,cb)=>{
            cb(null,'./uploads')},filename:(req,file,cb)=>{
                cb(null,req.headers['bankname'].replaceAll(" ","_").toLowerCase()+file.fieldname.toLowerCase()+path.extname(file.originalname))}})
                
const uploadsBus = multer({storage:storage}) 
const uploadsBank = multer({storage:storage2})



module.exports = {uploadsBus,uploadsBank}