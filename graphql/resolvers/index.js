const bcrypt = require("bcryptjs");

const Event = require("../../models/event");
const User = require("../../models/user");


//callbacks and promises
const user = userID => {
    return User.findById(userID)
        .then(user => {
            return {
                ...user._doc,
                _id: user.id,
                createdEvents: events.bind(this, user._doc.createdEvents)
            };
        })
        .catch(err => {
            throw err;
        });
};

//async await
const events = async eventIds => {
    try {
        const events = await Event.find({ _id: { $in: eventIds } });
        return events.map(event => {
            return {
                ...event._doc,
                _id: event.id,
                date: new Date(event._doc.date).toISOString(),
                creator: user.bind(this, event.creator)
            };
        });
    } catch (err) {
        throw err;
    }
};


//below is a mix of callback/promises vs async/await for future reference
module.exports = {
    events: async () => {
        try {
            const events = await Event.find()
            return events.map(event => ({
                ...event._doc,
                _id: event._id,
                date: new Date(event._doc.date).toISOString(),
                creator: user.bind(this, event._doc.creator)
            }));
        }
        catch (err) {
            throw err
        }
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
                    _id: res._doc._id.toString(),
                    date: new Date(event._doc.date).toISOString(),
                    creator: user.bind(this, res._doc.creator)
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
            .catch(err => {
                throw err;
            });
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
};
