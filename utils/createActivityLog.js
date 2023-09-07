const ActivityLogs = require("../models/activityLog.model")

const createActivityLog = async(companyId,name,action)=>{
    const newActivityLog = new ActivityLogs({companyId,name,activity:action,time:Date.now()})
    await newActivityLog.save()
}

module.exports = createActivityLog