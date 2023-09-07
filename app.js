const express = require("express");
const cors = require('cors')
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const device = require("express-device")
const path = require('path');
const {applyMiddleware, middleware} = require("graphql-middleware")
const {graphqlHTTP} = require("express-graphql")
const http = require('http');

const app = express()
const server = http.createServer(app)
require("./services/socketIO")(server)
require('dotenv').config()
require("./config")
const schema = require("./graphql/schema")
const getCityFromIp = require("./utils/getCityFromIP")
const {checkLocation} = require("./middlewares/location.cache.middleware") 
const getDeviceType = require("./middlewares/deviceType.middleware")
const uploadFileService = require("./services/uploadFile.service")
const authMiddleware = require("./middlewares/auth.middleware")
const authPermission = require("./graphql/permissions/authPermission")
const {uploadsBus,uploadsBank} = require("./utils/multerConfig")
const {downloadFile} = require("./services/downloadFile.service")
const StartWebScrapp = require("./services/webScrapping")
const {testCreateTrip,testDeleteAllData,testDeleteBusData,testDeleteBusCompanyRoute, testDeleteEmployeeData, testDeleteScheduleData} = require("./services/test.service")

Sentry.init({
  dsn: "https://918f046266284fbdbd85d61a1a7d801c@o1413547.ingest.sentry.io/6754649",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler(),
  Sentry.Handlers.tracingHandler(),
  cors(),
  express.json(),
  express.static(path.resolve(__dirname,"uploads")),
  express.urlencoded({extended:false}),
  device.capture(),
  Sentry.Handlers.errorHandler());
app.post("/api/v1/uploadLogoFile",[authMiddleware,uploadsBus.single("LogoFile")],uploadFileService)
app.post("/api/v1/uploadLicenseFile",[authMiddleware,uploadsBus.single("LicenseFile")],uploadFileService)
app.post("/api/v1/uploadBankLogo",[authMiddleware,uploadsBank.single("BankLogo")],(req,res)=>res.json({}))
app.post("/api/v1/uploadDriverLicense",[authMiddleware,uploadsBus.single("DriverLicense")],(req,res)=>res.json({}))
app.get("/api/v1/downloadPassengers/:tripId",[authMiddleware],downloadFile)
if(process.env.NODE_ENV=="development"||process.env.NODE_ENV=="testing"){
  app.post("/api/v1/createTestTrip",testCreateTrip)
  app.delete("/api/v1/deleteTestData",testDeleteAllData)
  app.delete("/api/v1/deleteTestDataBus",testDeleteBusData)
  app.delete("/api/v1/deleteTestDataEmployee/:type",testDeleteEmployeeData)
  app.delete("/api/v1/deleteBusCompanyRouteData/:id",testDeleteBusCompanyRoute)
  app.delete("/api/v1/deleteScheduleData",testDeleteScheduleData)
}
app.use("/graphql",graphqlHTTP({
  schema:applyMiddleware(schema),
  graphiql: process.env.NODE_ENV==="development"?true:false,
  middleware:[authPermission]
}))

// StartWebScrapp()

app.get("/getCity/:ip",[checkLocation,getDeviceType],getCityFromIp)
server.listen(process.env.PORT,()=>{
 console.log(`Listening on port ${process.env.PORT}`)
})


