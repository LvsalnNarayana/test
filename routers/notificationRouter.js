import express from 'express';
import { deleteAllNotifications, getNotifications, markAllAsRead, markAsRead } from '../controllers/notificationController.js';

const notificationRouter = (io) => {
    const router = express.Router();
    router.get('/notifications', (req, res) => {
        getNotifications(req, res, io);
    });
    router.post('/notifications/mark-all-read', (req, res) => {
        markAllAsRead(req, res, io);
    });
    router.post('/notifications/:notificationId/mark-read', (req, res) => {
        markAsRead(req, res, io);
    });
    router.get('/notifications/:notificationId/delete', (req, res) => {

    });
    router.post('/notifications/clear-all', (req, res) => {
        deleteAllNotifications(req, res, io);
    });
    return router;
}
export default notificationRouter;