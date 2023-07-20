import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import { GetUserSockets } from "../utilities/serverStore.js";

export const sendRequest = asyncHandler(async (req, res, io) => {
  const sessionUser = req?.session?.user?.id;
  const receiverId = req?.body?.receiverId;
  try {
    const requestData = { senderId: sessionUser, receiverId };
    const requestResult = await User.sendRequest(requestData);
    const sockets = GetUserSockets(sessionUser);
    const receiverSockets = GetUserSockets(receiverId);
    if (requestResult) {
      const userRelation = await User.checkUserRelations(
        receiverId,
        sessionUser
      );
      const receiverRelation = await User.checkUserRelations(
        sessionUser,
        receiverId
      );
      receiverSockets.forEach((socket) => {
        io.to(socket).emit("request-sent-notification", requestResult?.notification);
        io.to(socket).emit("request-sent-receiver", receiverRelation);
      });
      sockets.forEach((socket) => {
        io.to(socket).emit("request-sent-user", userRelation);
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
export const acceptRequest = asyncHandler(async (req, res, io) => {
  const senderId = req?.body?.senderId;
  const sessionUser = req?.session?.user?.id;
  const requestData = {
    senderId: senderId,
    sessionUser: sessionUser,
  };

  try {
    const requestResult = await User.acceptRequest(requestData);
    const userFriends = await User.findById(sessionUser).populate('friends', 'username').select('friends')
    const senderFriends = await User.findById(senderId).populate('friends', 'username').select('friends')
    const senderSockets = GetUserSockets(senderId);
    const userSockets = GetUserSockets(sessionUser);
    if (requestResult?.request?.status === 'accepted') {
      const userRelation = await User.checkUserRelations(
        senderId,
        sessionUser
      );
      const senderRelation = await User.checkUserRelations(
        sessionUser,
        senderId
      );
      userSockets.forEach((socket) => {
        io.to(socket).emit("request-accepted-user", { ...userRelation, friends: userFriends?.friends });
      });
      senderSockets.forEach((socket) => {
        io.to(socket).emit("request-accepted-sender", { ...senderRelation, friends: senderFriends?.friends });
        io.to(socket).emit("request-accepted-notification", requestResult?.notification);
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
export const rejectRequest = asyncHandler(async (req, res) => {
  const senderId = req?.body?.senderId;
  const sessionUser = req?.session?.user?.id;
  const requestData = {
    senderId: senderId,
    sessionUser: sessionUser,
  };
  try {
    const request = await User.rejectRequest(requestData);
    const senderSockets = GetUserSockets(senderId);
    const userSockets = GetUserSockets(sessionUser);
    const userRelation = await User.checkUserRelations(
      senderId,
      sessionUser
    );
    const senderRelation = await User.checkUserRelations(
      sessionUser,
      senderId
    );
    if (request) {
      userSockets.forEach((socket) => {
        io.to(socket).emit("request-rejected-user", userRelation);
      });
      senderSockets.forEach((socket) => {
        io.to(socket).emit("request-rejected-sender", senderRelation);
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
  const receiverId = req?.body?.receiverId;
  const sessionUser = req?.session?.user?.id;
  const requestData = {
    receiverId: receiverId,
    sessionUser: sessionUser,
  };
  try {
    const cancelledRequest = await User.cancelRequest(requestData);
    const sockets = GetUserSockets(sessionUser);
    const receiverSockets = GetUserSockets(receiverId);
    const userRelation = await User.checkUserRelations(
      receiverId,
      sessionUser
    );
    const receiverRelation = await User.checkUserRelations(
      sessionUser,
      receiverId
    );
    if (cancelledRequest) {
      sockets.forEach((socket) => {
        io.to(socket).emit("request-cancelled-user", userRelation);
      });
      receiverSockets.forEach((socket) => {
        io.to(socket).emit("request-cancelled", receiverRelation);
      });
      res.status(200).json({ success: cancelledRequest });
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
