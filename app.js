const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event')

const app = express();
events = []
app.use(bodyParser.json())

app.get('/', (req, res, next) => {
    res.send('hello')
})

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!,
            title: String!,
            description: String!,
            price: Float!,
            date: String!
        }

        input EventInput {
            title: String!,
            description: String!,
            price: Float!,
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find().then(events=>{
                return events.map(event=>({...event._doc, _id:event._id.toString()}))
            }).catch(err=>console.log(err))
        },
        createEvent: (args) => {
            // const event = {
            //     _id: Math.random().toString(),
                // title: args.eventInput.title,
                // description: args.eventInput.description,
                // price: +args.eventInput.price,
                // date: args.eventInput.date
            // }

            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date)
            })
            event.save().then((res)=>{
                console.log(res)
                return {...res._doc, _id: res._doc._id.toString()}
            }).catch(err=>console.log(err))
            
            return event
        }
    },
    graphiql: true
}))

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-8h3gr.mongodb.net/${process.env.MONGODB}?retryWrites=true`)

.then(()=> {
    app.listen(3000)
}
).catch(error=>console.log(error))
