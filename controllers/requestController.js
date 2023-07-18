import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import { GetUserSockets } from "../utilities/serverStore.js";

export const sendRequest = asyncHandler(async (req, res, io) => {
  try {
    const requestData = {
      senderId: req?.session?.user?.id,
      receiverId: req?.body?.receiverId,
    };
    const requestResult = await User.sendRequest(requestData);
    const sockets = GetUserSockets(req?.session?.user?.id);
    const receiverSockets = GetUserSockets(req?.body?.receiverId);
    const relation = await User.checkUserRelations(
      req?.body?.receiverId,
      req?.session?.user?.id
    );
    if (requestResult) {
      receiverSockets.forEach((socket) => {
        io.to(socket).emit("request-received", requestResult?.notification);
      });
      sockets.forEach((socket) => {
        io.to(socket).emit("request-sent", relation);
      });
      res.status(200).json(requestResult?.request);
    } else {
      res.status(500).json({
        success: false,
        message: "something went wrong please try again!",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
export const acceptRequest = asyncHandler(async (req, res) => {
  const requestData = {
    senderId: req?.body?.senderId,
    sessionUser: req?.session?.user?.id,
    requestId: req?.body?.requestId,
  };
  try {
    const request = await User.acceptRequest(requestData);
    if (request) {
      res.status(200).json(request);
    } else {
      res.status(500).json({
        success: false,
        message: "something went wrong please try again!",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
export const rejectRequest = asyncHandler(async (req, res) => {
  const requestData = {
    senderId: req?.body?.senderId,
    sessionUser: req?.session?.user?.id,
    requestId: req?.body?.requestId,
  };
  try {
    const request = await User.rejectRequest(requestData);
    const senderSockets = GetUserSockets(req?.body?.senderId);
    const relation = await User.checkUserRelations(
      req?.body?.senderId,
      req?.session?.user?.id
    );
    if (request) {
      senderSockets.forEach((socket) => {
        io.to(socket).emit("request-received", relation);
      });
      res.status(200).json(request);
    } else {
      res.status(500).json({
        success: false,
        message: "something went wrong please try again!",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "something went wrong please try again!",
    });
  }
});
export const cancelRequest = asyncHandler(async (req, res) => {
  const requestData = {
    userId: req?.body?.userId,
    sessionUser: req?.session?.user?.id,
    requestId: req?.body?.requestId,
  };
  try {
    const request = await User.cancelRequest(requestData);
    if (request) {
      res.status(200).json({ success: request });
    } else {
      res.status(500).json({
        success: false,
        message: "something went wrong please try again!",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
export const getAllFriendRequests = asyncHandler(async (req, res) => {
  try {
    const requests = await User.getAllFriendRequests(req?.session?.user?.id);
    if (requests) {
      res.status(200).json(requests);
    } else {
      res.status(500).json({
        success: false,
        message: "something went wrong please try again!",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "something went wrong please try again!",
    });
  }
});
