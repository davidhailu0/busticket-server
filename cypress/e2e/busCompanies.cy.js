import jwt from "jsonwebtoken"
import { signUpBusCompany, signIn } from "../support/busCompanyQueries"

describe("Testing the Bus Company End Points",()=>{
 
    it("Signing Up Process",()=>{
        cy.request({url:`http://${Cypress.env("HOST")}:${Cypress.env("PORT")}/api/v1/deleteTestData`,method:"DELETE"})
        cy.requestGraphql(signUpBusCompany).then(resp=>{
            expect(resp['body']["data"]["addBusCompany"]['name']).equal("Bunna Bus")
        })
    })

    it("sign in process",()=>{
        cy.requestGraphql(signIn).then(resp=>{
            expect(resp['body']["data"]["loginBusCompany"]['name']).equal("Bunna Bus")
        })
    })

    it("adding Bus",()=>{
        cy.requestGraphql(signIn).then(resp=>{
            const token = jwt.verify(resp['body']["data"]["loginBusCompany"]['token'],"B3C0NBUS!N3GR0UP")
            cy.requestGraphql(`mutation addBus{
                addBus(newBusInput:{
                    busOwner:"${token._id}",
                    busBrand:"busBrand",
                    busModel:"busModel",
                    manufacturedYear:10,
                    plateNumber:"plateNumber",
                    features:"${["WI-FI","USB Charger"]}",
                    numberOfSeats:49,
                    unavailableSeats:0,
                    VIN:"aaa4785965587"
                },activity:{
                    companyId:"${token._id}",
                    name:"${token.accountName}"
                }){
                    plateNumber
                }
            }`).then(respBus=>{
                expect(respBus['body']["data"]["addBus"]['plateNumber']).equal("plateNumber")
            })
        })
    })

})