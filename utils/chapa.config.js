const Chapa = require("chapa")
const myBusChapa = new Chapa("CHASECK_TEST-VQxadqx9ILgQUFZfnU15emtuvWEBlNma")

const payForTheOrder = async(req,res)=>{
    let customerInfo = {
        amount: '100',
        currency: 'ETB',
        email: 'abebe@bikila.com',
        first_name: 'Abebe',
        last_name: 'Bikila',
        // tx_ref: 'tx-x12345', // if autoRef is set in the options we dont't need to provide reference, instead it will generate it for us
        callback_url: 'https://chapa.co', // your callback URL
        customization: {
            title: 'My Bus Payment',
            description: 'Pay for your Trip'
        }
    }
    const response = await myBusChapa.initialize(customerInfo,{ autoRef: true })
    return res.redirect(response.data['checkout_url']);
}

const verifyPayment = async(tx_reference)=>{
    const reference = await myBusChapa.verify(tx_reference)
}

module.exports = {payForTheOrder,verifyPayment}