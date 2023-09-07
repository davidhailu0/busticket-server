var expressValidations = require('express-validations');

const validateFields = (req,res,next)=>{
    const {starting_place,destination,price,date} = req.body;
    if(!expressValidations.isValidFullname(starting_place)||!expressValidations.isValidFullname(destination)||
    !expressValidations.isNumeric(price)||
    !expressValidations.isValidDate(date)){
        return res.json({"Status":"Failed","Message":"You have entered invalid data format"})
    }
    return next()
}

module.exports = validateFields