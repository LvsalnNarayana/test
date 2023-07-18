import express from 'express';
import { Login, Logout, Signup } from '../controllers/authController.js';

const authRouter = () => {
    const router = express.Router();
    router.post('/login', (req, res) => {
        Login(req, res);
    });
    router.post('/logout', (req, res) => {
        Logout(req, res);
    });
    router.post('/signup', (req, res) => {
        Signup(req, res);
    });
    return router;
}
export default authRouter;