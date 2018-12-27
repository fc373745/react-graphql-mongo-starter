const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();

app.use(bodyParser.json());

const events = eventIds => {
    return Event.find({_id: {$in: eventIds}}).then(
        events=>{
            return events.map(event=> {
                return { ...event._doc, _id: event.id, creator: user.bind(this, event.creator)}
            })
        }
    ).catch(err=>{throw err})
}

app.get("/", (req, res, next) => {
    res.send("hello");
});


const user = userID => {
    return User.findById(userID).then().catch(err =>{
        then(user => {
            return {
                ...user._doc, _id: user.id, creator: user.bind(this, event._doc.creator)
            }
        })
        .tach(err => {
            throw err
        })
    })
}

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
            creator: User!
        }

        type User {
            _id: ID!
            email: String!
            password: String
            createdEvents: [Event!]
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
                return Event.find().populate('creator')
                    .then(events => {
                        return events.map(event => ({
                            ...event._doc,
                            _id: event._id,
                            creator: {
                                ...event._doc.creator._doc, 
                                _id: event._doc.creator.id
                            }
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
                    creator: "5c23d8189f1a7e3d180cca7a"
                });
                let createdEvent;
                return event
                    .save()
                    .then(res => {
                        createdEvent = {
                            ...res._doc,
                            _id: res._doc._id.toString()
                        };
                        return User.findById("5c23d8189f1a7e3d180cca7a");
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
                    .catch(err =>{
                        throw err
                    } );
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
