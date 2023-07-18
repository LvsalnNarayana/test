import express from 'express';
import { getUser } from '../controllers/userController.js';

const userRouter = () => {
    const router = express.Router();
    router.get('/users/:username', (req, res) => {
        getUser(req, res);
    });
    router.get('', (req, res) => {

    });
    return router;
}
export default userRouter;
