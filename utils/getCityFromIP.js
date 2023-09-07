const https = require("https")
const { locationCache } =  require("../middlewares/location.cache.middleware")

const API_KEY = "Bearer 3785|HeGlqnpxwgnwSVhjy1NIvF2EHoSCbkqmCMShEaLE";

const getCityfromIP = async(req,res)=>{
    const {ip} = req.params;
    var options = {
        host: `ipxapi.com`,
        path: `/api/ip?ip=${ip}`,
        headers: {
            "Accept": "application/json",
            "Authorization": API_KEY
        }
    };
    res.header("Access-Control-Allow-Origin", "*");
    if(!ip){
        return res.end()
    }
    const httpGet = https.request(options, (response) => {
        let data = ""
        response.on("data", (chunk) => {
            data += chunk;
        });
        response.on("end",()=>{
            if(JSON.parse(data)['regionName']){
                const regionName = JSON.parse(data)['regionName'].toLowerCase()
                if(regionName.includes("addis ababa")||regionName.includes("amhara")){
                    locationCache.set(ip,{city:JSON.parse(data)['city'],lang:"amh"})
                    return res.status(200).json({message:"success",city:JSON.parse(data)['city'],lang:"amh"})
                }
                else if(regionName.includes("oromiya")){
                    locationCache.set(ip,{city:JSON.parse(data)['city'],lang:"orm"})
                    return res.status(200).json({message:"success",city:JSON.parse(data)['city'],lang:"orm"})
                }
                else{
                    locationCache.set(ip,{city:JSON.parse(data)['city'],lang:"eng"})
                    return res.status(200).json({message:"success",city:JSON.parse(data)['city'],lang:"eng"})
                }
            }
            return res.end()
        })
    })
    httpGet.end()
}

module.exports = getCityfromIP