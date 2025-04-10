import express from "express";
import {
  getKeepAlive,
  getLeaderboardCSV,
  testNotification,
  markAsRead,
  sendNotifications,
  getMemberList,
  sendMessageAll,
  sendMessage,
} from "../controllers/apiController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/keep-alive", getKeepAlive);
router.get("/download-ranking", adminAuth, getLeaderboardCSV);
router.get("/bot/members", adminAuth, getMemberList);

router.post("/test-notification", auth, testNotification);
router.post("/send-notification", adminAuth, sendNotifications);
router.post("/bot/send-message", adminAuth, sendMessage);
router.post("/bot/send-message-all", adminAuth, sendMessageAll);

router.put("/mark-read/:notificationId", auth, markAsRead);

export default router;
