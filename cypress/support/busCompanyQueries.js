export const signUpBusCompany = `
mutation addBusCompany{
  addBusCompany(busCompany:{
    name:"Bunna Bus",
    phoneNumber:"0974859687",
    email:"info@buna.et",
    password: "12345678",
    numberOfBuses:10
  }){
    _id
    name
    phoneNumber
    email
    password
    active
    logo
    license
    token
  }
}
`

export const signUpTripManager = `
mutation addEmployee{
  addEmployee(employeeInfo:{
    name:employeeName,
    phoneNumber:[employeePhone1,employeePhone2],
    busCompany:token._id,
    address:employeeAddress,
    role:employeeRole,
    password:password||null,
    emergencyContactName:emergencyName,
    emergencyContactPhone:emergencyPhone,
    suretyName:guarantorName,
    suretyPhone:guarantorPhone,
    languages:selectedLangs,
    licenseType:employeeLicenseType,
    licenseID:employeeLicense,
    licensePhoto:employeeLicensePhoto?employeeName+"DriverLicense"+employeeLicensePhoto["name"].substring(employeeLicensePhoto["name"].lastIndexOf(".")):null,
    licenseExpiryDate:employeeLicenseExpiry.toString()
},activity:$activity){
      name
      phoneNumber
  }
}
`

export const signIn = `
mutation loginBusCompany{
    loginBusCompany(loginInfo:{email:"info@buna.et",password:"12345678"}){
        _id
        name
        token
    }
  }
`
export const signInTripManager = `
mutation loginBusCompany{
    loginBusCompany(loginInfo:{email:"0911111111",password:"12345678"}){
        _id
        token
    }
  }
`
