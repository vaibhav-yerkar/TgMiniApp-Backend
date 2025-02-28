import express from "express";
import {
  getKeepAlive,
  getLeaderboardCSV,
  testNotification,
  markAsRead,
} from "../controllers/apiController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/keep-alive", getKeepAlive);
router.get("/download-ranking", adminAuth, getLeaderboardCSV);
router.post("/test-notification", auth, testNotification);
router.put("/mark-read/:notificationId", auth, markAsRead);

export default router;
