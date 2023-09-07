const nodeMailer = require("nodemailer")

let transporter = nodeMailer.createTransport({
    host: "mail.mybusethiopia.com",
    port:465,
    secure: true,
    auth: {
      user: 'dev@mybusethiopia.com',
      pass: 'chang3P@ssword',
    },
});
const sendEmail = async(to,subject,content,html)=>{
  try{
    const response = await transporter.sendMail({
      from:'"MyBus Ethiopia" <dev@mybusethiopia.com>',
      to,
      subject,
      text:content,
      html
   })
   console.log(response.messageId)
  }
  catch(e){
    console.log(e)
  }
 
}

module.exports = sendEmail