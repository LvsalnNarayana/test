import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import express from 'express';
import { createServer } from 'http';
import bodyParser from 'body-parser';

import { connectDB } from './utilities/connectDB.js';
import { sessionMiddleware } from './utilities/sessionMiddleware.js';
import { registerSocket } from './utilities/registerSocket.js';

import authRouter from './routers/authRouter.js';
import requestRouter from './routers/requestRouter.js';
import userRouter from './routers/userRouter.js';
import postRouter from './routers/postRouter.js';
import notificationRouter from './routers/notificationRouter.js';
import commentRouter from './routers/commentRouter.js';

dotenv.config();
connectDB(process.env.MONGODB_URL);


const app = express();
const server = createServer(app);
const io = registerSocket(server);
// app.use(helmet())
app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ["set-cookie"]
}));

const checkAuth = (req, res, next) => {
    if (req?.session?.user) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

app.get('/', (req, res) => {
    if (req?.session?.user != null || req?.session?.user != undefined) {
        res.status(200).json({ loggedIn: true, user: req?.session?.user });
    } else {
        res.status(200).json({ success: false, message: 'Not Authorized' })
    }
})

app.use(authRouter(io));
app.use(checkAuth, userRouter(io));
app.use(checkAuth, requestRouter(io));
app.use(checkAuth, notificationRouter(io));
app.use(checkAuth, postRouter(io));
app.use(checkAuth, commentRouter(io))
app.use('*',(req,res)=>{
    res.status(404).send("wow")
})
// Start the server
server.listen(process.env.PORT, () => {
    console.log('Server started on http://localhost:' + process.env.PORT);
});
