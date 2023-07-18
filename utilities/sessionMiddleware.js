import { default as connectMongodbSession } from 'connect-mongodb-session';
import session from 'express-session';
import dotenv from 'dotenv';


dotenv.config();
const MongoDBStore = connectMongodbSession(session);

const store = new MongoDBStore({
    uri: process.env.MONGODB_URL,
    collection: 'sessions',
});
export const sessionMiddleware = session({
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
    },
    name: 'utker',
    secret: 'this is secret key to encode all details',
    saveUninitialized: false,
    resave: true,
    store: store,
})