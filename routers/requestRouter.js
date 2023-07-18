import express from 'express';
import { acceptRequest, cancelRequest, getAllFriendRequests, rejectRequest, sendRequest } from '../controllers/requestController.js';

const requestRouter = () => {
    const router = express.Router();

    router.post('/friends/send-request', (req, res) => {
        sendRequest(req, res);
    });
    router.post('/friends/accept-request', (req, res) => {
        acceptRequest(req, res);
    });
    router.post('/friends/reject-request', (req, res) => {
        rejectRequest(req, res);
    });
    router.post('/friends/cancel-request', (req, res) => {
        cancelRequest(req, res);
    });
    router.get('/friends/get-requests', (req, res) => {
        getAllFriendRequests(req, res);
    });
    return router;
}
export default requestRouter;