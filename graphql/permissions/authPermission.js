const {shield,rule} = require("graphql-shield")
const jwt = require("jsonwebtoken")

const extractAndDecodeToken = (ctx)=>{
  const token = ctx.headers['cookie'].split(";").find((str)=>str.includes("token")).split("=")[1]
  const passToken =  jwt.verify(token,process.env.TOKEN_KEY)
  return passToken._doc.role
}

const isAdmin = rule({ cache: "contextual" })(
    async (parent, args, ctx, info) => {
      let role = extractAndDecodeToken(ctx)
      return role === "ADMIN"}
);

const isBus = rule({ cache: "contextual" })(
  async (parent, args, ctx, info) => {
    let role = extractAndDecodeToken(ctx)
    return role === "BUS COMPANY"}
);



const authPermissions = shield({
    Query: {
      getManagementData: isAdmin,
    },
    Mutation:{
       addTrip: isAdmin,
       updateTrip: isAdmin,
       deleteTrip: isAdmin,
       addBus:isBus,
       updateBus: isBus,
       deleteBus: isBus
    }
  });

module.exports = authPermissions