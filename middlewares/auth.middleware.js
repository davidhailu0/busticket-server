const jwt = require("jsonwebtoken")

const authMiddleware = (req,res,next)=>{
    let {token} = req.headers;
    if(!token){
        return res.status(401).json({"status":"error","message":"you are not authorized"})
    }
    try{
        const passToken = jwt.verify(token,process.env.TOKEN_KEY)
        req.user = passToken
        if(passToken.role!=="BUS COMPANY"&&passToken.role!=="TRIP MANAGER"&&passToken.role!=="SUPER ADMIN"&&passToken.role!=="ADMIN"){
            return res.status(401).json({"message":"unauthorized"})
        }
        next()
    }
    catch(e){
        return res.status(401).json({"status":"error","message":"Invalid Token format"})
    }
}
module.exports = authMiddleware