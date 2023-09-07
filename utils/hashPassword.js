const bcrypt = require("bcryptjs")

const getHashedPassword = async(rawPassword)=>{
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(rawPassword,salt)
    return hashedPassword
}
module.exports = getHashedPassword