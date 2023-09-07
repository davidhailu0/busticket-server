
const {join} = require('path');
const { readdirSync, readFileSync } = require('fs');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const resolvers = require("./resolvers")

const gqlFiles = readdirSync(join(__dirname, './typedefs'));

let typeDefs = '';

gqlFiles.forEach((file) => {
  typeDefs += readFileSync(join(__dirname, './typedefs', file), {
    encoding: 'utf8',
  });
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = schema
















// const {GraphQLSchema, GraphQLObjectType, GraphQLList} = require("graphql")
// const registeredTripsModel = require("../models/registeredTrip")
// const registeredTrip = require("../Types/registeredTripType")

// const RootQuery = new GraphQLObjectType({
//     name:"Root",
//     fields:{
//         RegisteredTrip:{
//         type:new GraphQLList(registeredTrip),
//         resolve(parent,args){
//         return registeredTripsModel.find()
//       }
//     },
// }
// })

// const schema = new GraphQLSchema({
//     query:RootQuery
// })
// module.exports = schema