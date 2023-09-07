const excelToJson = require('convert-excel-to-json');
const fs = require("fs")
const path = require("path")
const XLSX = require("xlsx")
const Customer = require("../models/customer.model")
const Ticket = require("../models/ticket.model")
const Device = require("../models/device.model")
const getHashedPassword = require("../utils/hashPassword")

const getDashBoardData = async(req,res)=>{
    
    res.json({totalCustomers,totalRevenue,totalTicketsSoldToday,todayTicketArray,previousYearDataResult,thisYearDataResult,numberOfDevices,ticketsPurchased})
}

const addCustomer = async(req,res)=>{
    // const customers = await 
}

const getAllCustomer = async(req,res)=>{
    const customers = (await Customer.find().select("-password")).map(({role,_id,firstName,middleName,lastName,email,phoneNumber})=>({id:_id,firstName,middleName,lastName,email,phoneNumber,role}))
    res.json({"status":"success","data":customers})
}

const importFile = async(req,res)=>{
    const filePath = path.resolve(__dirname + '/../uploads/' + req.file.filename);
    const excelData = excelToJson({
        sourceFile: filePath,
        sheets:[{
        name: 'Customers',
        header:{
        rows: 1
        },
        columnToKey: {
        A: 'id',
        B: 'firstName',
        C: 'middleName',
        D: 'lastName',
        E: 'email',
        F:'password',
        G:'phoneNumber',
        H:'address'
        }
        }]
        });
        let modifiedExcelData = excelData["Customers"].map(async (obj) => {
            return { ...obj, password: await getHashedPassword(obj.password) };
        })
        const data = await Promise.all(modifiedExcelData)
        Customer.insertMany(data,async(err,data)=>{
            if(err){
                return res.json({"status":"error","message":"Please Make sure the data is valid format"})
            }
            const allCustomers = (await Customer.find().select("-password")).filter(({role})=>role==='CUSTOMER').map(({_id,firstName,middleName,lastName,phoneNumber,email})=>({id:_id,firstName,middleName,lastName,phoneNumber,email}))
            fs.unlinkSync(filePath);
            return res.json({"status":"success","data":allCustomers})
        })
}

const exportFile = async(req,res)=>{
    const wb = XLSX.utils.book_new()
    const customers = await Customer.find().select(["-password","-__v"])
    let temp = JSON.stringify(customers)
    temp = JSON.parse(temp)
    let ws = XLSX.utils.json_to_sheet(temp)
    let down = path.resolve(__dirname+'/../public/exportdata.xlsx')
    XLSX.utils.book_append_sheet(wb,ws,"Customer");
    XLSX.writeFile(wb,down)
    res.download(down)
} 

const getAdminInfo = async(req,res)=>{
    const {_id,firstName,middleName,lastName,phoneNumber,address} = req.user
    return res.json({_id,firstName,middleName,lastName,phoneNumber,address})
}

const changePassword = async(req,res)=>{
    const {_id,newPassword} = req.body
    const adminObj = await Customer.findById(_id)
    adminObj.password = await getHashedPassword(newPassword)
    res.json({'status':'success'})
}

const changeProfileInfo = async(req,res)=>{
    const {_id} = req.body
    delete req.body._id
    await Customer.findOneAndUpdate({_id:_id},{...req.body})
    await Customer.findById(_id)
    Object.assign(req.user,req.body)
    await Customer.deleteMany()
    return res.json({"status":"success","data":{}})

}
module.exports = {getDashBoardData,getAllCustomer,importFile,exportFile,getAdminInfo,changePassword,changeProfileInfo}

