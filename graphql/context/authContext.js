const jwt = require("jsonwebtoken")

const createContext = ({ req }) => {
    const {token} = req.headers;
    let auth = null;
    if(!token){
        throw new Error("you are not authorized")
    }
    try{
        const passToken = jwt.verify(token,process.env.TOKEN_KEY)
        auth = passToken._doc.role
    }
    catch(e){
        throw new Error("Invalid Token format")
    }
    console.log(auth)
    return { auth };
  };

module.exports = createContext;