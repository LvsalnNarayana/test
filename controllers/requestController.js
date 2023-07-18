import User from "../models/userModel.js";
import asyncHandler from 'express-async-handler';

export const sendRequest = asyncHandler(async (req, res) => {
    try {
        const requestData = { senderId: req?.session?.user?.id, receiverId: req?.body?.receiverId }
        const request = await User.sendRequest(requestData);
        if (request) {
            res.status(200).json(request);
        } else {
            res.status(500).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
export const acceptRequest = asyncHandler(async (req, res) => {
    const requestData = { userId: req?.body?.userId, sessionUser: req?.session?.user?.id, requestId: req?.body?.requestId }
    try {
        const request = await User.acceptRequest(requestData);
        if (request) {
            res.status(200).json(request);
        } else {
            res.status(500).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
export const rejectRequest = asyncHandler(async (req, res) => {
    const requestData = { userId: req?.body?.userId, sessionUser: req?.session?.user?.id, requestId: req?.body?.requestId }
    try {
        const request = await User.rejectRequest(requestData);
        if (request) {
            res.status(200).json(request);
        } else {
            res.status(500).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "something went wrong please try again!" });
    }
});

export const cancelRequest = asyncHandler(async (req, res) => {
    const requestData = { userId: req?.body?.userId, sessionUser: req?.session?.user?.id, requestId: req?.body?.requestId }
    try {
        const request = await User.cancelRequest(requestData);
        if (request) {
            res.status(200).json({ success: request });
        } else {
            res.status(500).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message:error?.message});
    }
});
export const getAllFriendRequests = asyncHandler(async (req, res) => {
    try {
        const requests = await User.getAllFriendRequests(req?.session?.user?.id);
        if (requests) {
            res.status(200).json(requests);
        } else {
            res.status(500).json({ success: false, message: "something went wrong please try again!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "something went wrong please try again!" });
    }
});