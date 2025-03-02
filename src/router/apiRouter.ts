import express from "express";
import {
  getKeepAlive,
  getLeaderboardCSV,
  testNotification,
  markAsRead,
  sendNotifications,
} from "../controllers/apiController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/keep-alive", getKeepAlive);
router.get("/download-ranking", adminAuth, getLeaderboardCSV);
router.post("/test-notification", auth, testNotification);
router.post("/send-notification", adminAuth, sendNotifications);
router.put("/mark-read/:notificationId", auth, markAsRead);

export default router;
