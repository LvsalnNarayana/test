import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import User from './models/userModel.js';
import dotenv from 'dotenv';
import { connectDB } from './utilities/connectDB.js';
import { sessionMiddleware } from './utilities/sessionMiddleware.js';
import helmet from 'helmet';
import asyncHandler from 'express-async-handler';

const app = express();
const server = createServer(app);
dotenv.config();
app.use(helmet())

connectDB(process.env.MONGODB_URL);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ["set-cookie"]
}));
app.get('/', asyncHandler(async (req, res) => {
    const user = await User.findByUsername('Shirley.Kautzer', '649ee5389409d2f598b4234e')
    console.log(user);
    res.status(200).json(user)
}))
//Express Session Middleware
// app.use(sessionMiddleware);
// Start the server
server.listen(process.env.PORT, () => {
    console.log('Server started on http://localhost:' + process.env.PORT);
});
