const BusCompany = require("../models/busCompany.model")
const uploadFile = async(req,res)=>{
    const id = req.headers['busproviderid']
    let updatedBus = null;
    if(req.file.filename.includes("License")){
        updatedBus = await BusCompany.findByIdAndUpdate(id,{$set:{license:req.file.filename}},{new:true})
    }
    else if(req.file.filename.includes("Logo")){
        updatedBus = await BusCompany.findByIdAndUpdate(id,{$set:{logo:req.file.filename}},{new:true})
    }
    return res.json({data:updatedBus})
}

module.exports = uploadFile