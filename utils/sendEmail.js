const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    port: 465,             
    host: "smtp.gmail.com",
       auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
         },
    secure: true,
    });

const sendEmail = (to,subject,text,html,res)=>{
    const mailData = {
        from: sendingEmail,  // sender address
        to,   // list of receivers
        subject,
        text,
        html
    };

    transporter.sendMail(mailData,(err,info)=>{
        if(err){
            return console.log(err)
        }
        res.status(200).json({message:"Success",message_id:info.messageId})
    })
}

module.exports = {
    sendEmail
}