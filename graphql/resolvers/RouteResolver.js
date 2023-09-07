const Route = require("../../models/route.model")
const createActivityLog = require("../../utils/createActivityLog")

const findSubrouteForSubRoute = async(passedSubroute)=>{
    const allSubroutes = []
    for(let subRoute of passedSubroute){
        const foundedSubroute = await Route.findById(subRoute)
            if(foundedSubroute){
                const allSubroutesInSubRoute = []
                for(let eachin of foundedSubroute.subRoutes){
                    const foundedSubrouteInSubroute = await Route.findById(eachin)
                    allSubroutesInSubRoute.push(foundedSubrouteInSubroute.toObject())
                }
                allSubroutes.push({...foundedSubroute.toObject(),subRoutes:allSubroutesInSubRoute})
            }
    }
    return allSubroutes
}
const routeQueries = {
    routes: async(_,args)=>{
        const allRoutes = await Route.find()
        const allRoutesConverted = []
        for(let rte of allRoutes){
            const allSubroutes = findSubrouteForSubRoute(rte.subRoutes)
            allRoutesConverted.push({...rte.toObject(),subRoutes:allSubroutes})
        }
        return allRoutesConverted
    },
    route:(_,{id})=>{
        return Route.findById(id)
    },
    locationList:async()=>{
        const allRoutes = await Route.find()
        const pickupLocations = []
        const returnPickupLocations = []
        for(let rt of allRoutes){
            for(let loc of rt.pickupLocations){
                if(!pickupLocations.includes(loc)){
                    pickupLocations.push(loc)
                }
            }
            for(let loc of rt.returnPickupLocations){
                if(!returnPickupLocations.includes(loc)){
                    returnPickupLocations.push(loc)
                }
            }
        }
        return {pickupLocations,returnPickupLocations}
    }
}

const routeMutations = {
    addRoute: async(_,{route,activity})=>{
        const newRoute = new Route({...route})
        await createActivityLog(activity.companyId,activity.name,`${newRoute.departure} - ${newRoute.destination} has been added`)
        return {...(await newRoute.save()).toObject()}
    },
    updateRoute: async(_,{id,route})=>{
        const routeUpdated = await Route.findByIdAndUpdate(id,{$set:{...route}},{new:true})
        await createActivityLog(activity.companyId,activity.name,`${routeUpdated.departure} - ${routeUpdated.destination} has been updated`)
        return {...routeUpdated.toObject()}
    },
    deleteRoute:(_,{id})=>{
        return Route.findByIdAndRemove(id)
    }
}

module.exports = {routeQueries,routeMutations}