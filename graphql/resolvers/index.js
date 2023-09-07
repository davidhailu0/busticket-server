const {busCompanyQueries,busCompanyMutations} = require('./BusCompanyResolver');
const {userQueries,userMutations} = require('./UserResolver');
const {tripQueries,tripMutations} = require('./TripResolver');
const {ticketQueries,ticketMutations} = require('./TicketResolver');
const {routeQueries,routeMutations} = require('./RouteResolver');
const {busQueries,busMutation} = require("./busResolver")
const {employeeQueries,employeeMutations} = require("./EmployeeResolver")
const {bankQueries,bankMutations} = require("./bankResolver")
const {scheduledQueries,scheduledMutations} = require("./scheduleResolver")
const {BackOfficeQueries,BackOfficeMutations} = require("./backOfficeResolver")
const {callCenterQueries,callCenterMutations} = require("./callCenterResolver")
const activityLogQueries = require("./ActivityLogResolver")

const resolvers = {
  Query: {
    ...activityLogQueries,
    ...busCompanyQueries,
    ...busQueries,
    ...userQueries,
    ...tripQueries,
    ...ticketQueries,
    ...routeQueries,
    ...employeeQueries,
    ...bankQueries,
    ...scheduledQueries,
    ...BackOfficeQueries,
    ...callCenterQueries
  },
  Mutation: {
    ...busCompanyMutations,
    ...busMutation,
    ...userMutations,
    ...tripMutations,
    ...ticketMutations,
    ...routeMutations,
    ...employeeMutations,
    ...bankMutations,
    ...scheduledMutations,
    ...BackOfficeMutations,
    ...callCenterMutations
  },
};

module.exports = resolvers