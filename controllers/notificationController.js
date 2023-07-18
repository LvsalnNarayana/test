import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';
import { GetUserSockets } from '../utilities/serverStore.js';

export const getNotifications = asyncHandler(async (req, res) => {
    try {
        const notifications = await User.getAllNotifications(req?.session?.user?.id);
        if (notifications) {
            res.status(200).json(notifications);
        } else {
            res.status(404).json({ success: false, message: "something went wrong please try again!" })
        }
    } catch (error) {
        res.status(404).json({ success: false, message: "something went wrong please try again!" })
    }
});
export const markAllAsRead = asyncHandler(async (req, res, io) => {
    try {
        const notifications = await User.markAllAsRead(req?.session?.user?.id);
        const notificationSockets = GetUserSockets(req?.session?.user?.id);
        if (notifications) {
            notificationSockets.forEach((socket) => {
                io.to(socket).emit('notification-mark-read', notifications);
            })
            res.status(200).json(notifications);
        } else {
            res.status(404).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(404).json({ success: false, message: "something went wrong please try again!" });
    }
});

export const markAsRead = asyncHandler(async (req, res) => {
    try {
        const notifications = await User.markAsRead(req?.params?.notificationId, req?.session?.user?.id);
        if (notifications) {
            res.status(200).json(notifications);
        } else {
            res.status(404).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(404).json({ success: false, message: error?.message });
    }
});

export const deleteAllNotifications = asyncHandler(async (req, res,io) => {
    try {
        const notifications = await User.deleteAllNotifications(req?.session?.user?.id);
        const notificationSockets = GetUserSockets(req?.session?.user?.id);
        if (notifications) {
            notificationSockets.forEach((socket) => {
                io.to(socket).emit('notification-mark-read', notifications);
            })
            res.status(200).json(notifications);
        } else {
            res.status(404).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(404).json({ success: false, message: error?.message });
    }
})