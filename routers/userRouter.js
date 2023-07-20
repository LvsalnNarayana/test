import express from 'express';
import { getUser,getFriends,unfriend } from '../controllers/userController.js';

const userRouter = (io) => {
    const router = express.Router();
    router.get('/users/:username', (req, res) => {
        getUser(req, res);
    });
    router.get('/friends', (req, res) => {
        getFriends(req, res);
    });
    router.post('/friends/:friendId/unfriend', (req, res) => {
        unfriend(req, res,io);
    });
    router.get('', (req, res) => {

    });
    return router;
}
export default userRouter;
