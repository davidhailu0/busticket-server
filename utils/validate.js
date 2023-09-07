const validateName = (name)=>{
    let patt = new RegExp(/^[a-z\sA-Z]+$|^[\u1200-\u135A]+$/g)
    if(!patt.test(name.trim())||name.trim().length<3){
        return false
    }
        return true
}

module.exports={validateName}