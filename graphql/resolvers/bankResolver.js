const Bank = require("../../models/bank.model")
const createActivityLog = require("../../utils/createActivityLog")

const bankQueries = {
    bank:async(_,{bankId})=>{
        const bankInfo = await Bank.findById(bankId);
        return bankInfo;
    },
    banks:async()=>{
        const allBanks = await Bank.find({available:true})
        return allBanks;
    },
    allBanks:async()=>{
        const allBanks = await Bank.find()
        return allBanks;
    }
}
const bankMutations = {
    addBank:async(_,{bank,activity})=>{
        const newBank = new Bank({...bank})
        await newBank.save()
        createActivityLog("MYBUS",activity.name,`${bank.name} Added to Database`)
        return newBank.toObject();
    },
    updateBank:async(_,{bankId,bank,activity})=>{
        const updatedBank = await Bank.findByIdAndUpdate(bankId,{$set:{...bank}},{new:true})
        createActivityLog("MYBUS",activity.name,`${updatedBank.name} Bank Account Info Updated`)
        return updatedBank.toObject()
    }
}

module.exports = {bankQueries,bankMutations}


