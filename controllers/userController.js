import User from "../models/userModel.js";
import asyncHandler from 'express-async-handler';
import { GetUserSockets } from "../utilities/serverStore.js";

export const getUser = asyncHandler(async (req, res) => {
    try {
        const username = req?.params?.username;
        const user = await User.findByUsername(username, req?.session?.user?.id);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ status: false, message: 'User Not Found' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error?.message })
    }
});

export const getFriends = asyncHandler(async (req, res) => {
    try {
        const user = await User.getAllFriends(req?.session?.user?.id);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ status: false, message: 'User Not Found' });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error?.message })
    }
});

export const unfriend = asyncHandler(async (req, res, io) => {
    const friendId = req?.params?.friendId;
    const sessionUser = req?.session?.user?.id;
    try {
        const unfriendData = await User.unfriend(friendId, sessionUser);
        if (unfriendData) {
            const userSockets = GetUserSockets(sessionUser);
            const friendSockets = GetUserSockets(friendId);
            const userRelation = await User.checkUserRelations(
                friendId,
                sessionUser
            );
            const friendRelation = await User.checkUserRelations(
                sessionUser,
                friendId
            );
            userSockets.forEach((socket) => {
                io.to(socket).emit('unfriend-user', { ...unfriendData?.sessionUser, ...userRelation });
            })
            friendSockets.forEach((socket) => {
                io.to(socket).emit('unfriend-friend', { ...unfriendData?.friend, ...friendRelation });
            })
            res.status(200).json({ success: true, messgae: 'Friend Removed' });
        } else {
            res.status(404).json({ status: false, message: error.message });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error?.message })
    }
})