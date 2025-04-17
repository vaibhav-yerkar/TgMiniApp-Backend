import express from "express";
import {
  getKeepAlive,
  getLeaderboardCSV,
  testNotification,
  markAsRead,
  sendNotifications,
} from "../controllers/apiController";
import {
  getCarousalList,
  addCarousalImage,
  removeCarousalImage,
} from "../controllers/carousalController";
import {
  getMemberList,
  EditBotResponse,
  sendMessage,
  sendMessageAll,
} from "../controllers/botController";

import { auth } from "../middleware/auth";
import { authOrAdmin } from "../middleware/authOrAdmin";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/keep-alive", getKeepAlive);
router.get("/download-ranking", adminAuth, getLeaderboardCSV);
router.get("/bot/members", adminAuth, getMemberList);
router.get("/carousal", authOrAdmin, getCarousalList);

router.post("/test-notification", auth, testNotification);
router.post("/send-notification", adminAuth, sendNotifications);
router.post("/bot/edit-response", adminAuth, EditBotResponse);
router.post("/bot/send-message", adminAuth, sendMessage);
router.post("/bot/send-message-all", adminAuth, sendMessageAll);
router.post("/carousal", adminAuth, addCarousalImage);

router.put("/mark-read/:notificationId", auth, markAsRead);

router.delete("/carousal/:imageId", adminAuth, removeCarousalImage);

export default router;
