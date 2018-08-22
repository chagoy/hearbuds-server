'use strict';

require('dotenv').config();
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const passport = require('passport');
const morgan = require('morgan');
const axios = require('axios');
const { TICKETMASTER_BASE_URL, TICKETMASTER_API_KEY } = require('./config')

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const {router: userRouter} = require('./users/router');

const { dbConnect } = require('./db');

//importing models

//typedefs

const schema = buildSchema(`
type User {
	id: ID!
	username: String!
	email: String!
}

type Event {
	name: String
	type: String
	id: String
	url: String
	images: [Image]
	classifications: [Classification]
	promoter: Promoter
	promoters: [Promoter]
	seatmap: Seatmap
	_embedded: Venue
	dates: Date
}

type Image {
	ratio: String
	url: String
	width: String
	height: String
	fallback: Boolean
}

type Seatmap {
	staticUrl: String
}

type Date {
	start: StartTime
	spanMultipleDays: Boolean
}

type StartTime {
	localDate: String
	localTime: String
	dateTime: String
	dateTBD: Boolean
	dateTBA: Boolean
	timeTBA: Boolean
}

type Classification {
	primary: Boolean
	family: Boolean
	genre: Genre
}

type Genre {
	id: String
	name: String
}

type Promoter {
	id: String
	name: String
	description: String
}

type Venue {
	name: String
	type: String
	id: String
	postalCode: String
	timezone: String
}

type Query {
	getUser(id: ID!): User
	getEvents: [Event]
}
`);



const getUser = (args) => {
  console.log(args);
  return 'user';
};

const getEvents = (args) => {
	return axios.get(`${TICKETMASTER_BASE_URL}events.json?size=10&apikey=${TICKETMASTER_API_KEY}`)
				.then(response => response.data._embedded.events)
}


// The root provides the top-level API endpoints
const resolvers = {
  getUser: (args) => getUser(args),
  getEvents: (args) => getEvents(args)
};

var app = express();

app.use(morgan('common'));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/users/', userRouter);
app.use('/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });


//a test protected endpoint
app.get('/protected', jwtAuth, (req, res) => {
  return res.json({
	  data: 'rosebud'
  });
});

//insert jwtAuth middleware once we're further along
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
}));
dbConnect();
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');

//creating our server
// const server = new ApolloServer({
// 	context: {},
// 	typeDefs,
// 	resolvers,
// 	debug: true
// });

// server.listen().then(({url}) => {
// 	//connect the database
// 	console.log(`current listening on ${url}`);
// });