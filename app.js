const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();
events = [];
app.use(bodyParser.json());

app.get("/", (req, res, next) => {
    res.send("hello");
});

app.use(
    "/graphql",
    graphqlHttp({
        schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
        rootValue: {
            events: () => {
                return Event.find()
                    .then(events => {
                        return events.map(event => ({
                            ...event._doc,
                            _id: event._id.toString()
                        }));
                    })
                    .catch(err => console.log(err));
            },
            createEvent: args => {
                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(args.eventInput.date),
                    creator: "5c23b0c6f173cd24870c17b2"
                });
                let createdEvent;
                return event
                    .save()
                    .then(res => {
                        createdEvent = {
                            ...res._doc,
                            _id: res._doc._id.toString()
                        };
                        return User.findById("5c23b0c6f173cd24870c17b2");
                    })
                    .then(user => {
                        if (!user) {
                            throw new Error("User not found.");
                        }
                        user.createdEvents.push(event);
                        return user.save();
                    })
                    .then(() => {
                        return createdEvent;
                    })
                    .catch(err => console.log(err));
            },
            createUser: args => {
                return User.findOne({ email: args.userInput.email })
                    .then(result => {
                        if (result) {
                            throw new Error("User exists already");
                        }
                        return bcrypt.hash(args.userInput.password, 12);
                    })
                    .then(hashedPassword => {
                        const user = new User({
                            email: args.userInput.email,
                            password: hashedPassword
                        });
                        return user.save();
                    })
                    .then(result => {
                        return {
                            ...result._doc,
                            password: null,
                            _id: result.id
                        };
                    })
                    .catch(err => {
                        throw err;
                    });
            }
        },
        graphiql: true
    })
);

mongoose
    .connect(
        `mongodb+srv://${process.env.MONGO_USER}:${
            process.env.MONGO_PASSWORD
        }@cluster0-8h3gr.mongodb.net/${process.env.MONGODB}?retryWrites=true`
    )

    .then(() => {
        app.listen(3000);
    })
    .catch(error => console.log(error));
