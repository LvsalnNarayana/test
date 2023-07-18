import express from "express";
import {
  acceptRequest,
  cancelRequest,
  getAllFriendRequests,
  rejectRequest,
  sendRequest,
} from "../controllers/requestController.js";

const requestRouter = (io) => {
  const router = express.Router();

  router.post("/friends/send-request", (req, res) => {
    sendRequest(req, res, io);
  });
  router.post("/friends/accept-request", (req, res) => {
    acceptRequest(req, res, io);
  });
  router.post("/friends/reject-request", (req, res) => {
    rejectRequest(req, res, io);
  });
  router.post("/friends/cancel-request", (req, res) => {
    cancelRequest(req, res, io);
  });
  router.get("/friends/get-requests", (req, res) => {
    getAllFriendRequests(req, res, io);
  });
  return router;
};
export default requestRouter;
