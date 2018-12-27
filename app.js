const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const mongoose = require("mongoose");
const app = express();

const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index')

app.use(bodyParser.json());

app.get("/", (req, res, next) => {
    res.send("hello");
});

app.use(
    "/graphql",
    graphqlHttp({
        schema:graphQlSchema,
        rootValue: graphQlResolvers,
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
