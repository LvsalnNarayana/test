import User from "../models/userModel.js";
import asyncHandler from 'express-async-handler';

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

