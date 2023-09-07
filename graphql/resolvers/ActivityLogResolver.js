const ActivityLogs = require("../../models/activityLog.model")
const BusCompany = require("../../models/busCompany.model")

const ActivityLogsQueries = {
    allActivityLogs:async()=>{
        const activityLogs = await ActivityLogs.find()
        const nameRefactored = []
        for(let obj of activityLogs){
            if(obj.companyId.toUpperCase()==="MYBUS"){
                nameRefactored.push({...obj.toObject()})
            }
            else{
                const busCompanyName = await BusCompany.findById(obj.companyId)
                nameRefactored.push({...obj.toObject(),companyId:busCompanyName.name})
            }
        }
        return nameRefactored;
    },
    activityLogs:async(_,{companyId})=>{
        const activityLogs = await ActivityLogs.find({companyId})
        return activityLogs.map(obj=>obj.toObject());
    }
}

module.exports = ActivityLogsQueries