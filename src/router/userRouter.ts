import express from "express";
import {
  getUserProfile,
  fetchUserProfile,
  getAllUsers,
  getLeaderboard,
  getOverallLeaderboard,
  getUnderScrutinyTasks,
  completeTask,
  updateUser,
  resetTaskScore,
  rewardInviter,
  getUsername,
  markTask,
  updateTaskStatus,
  updateUserName,
  deleteUser,
} from "../controllers/userController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/profile", auth, getUserProfile);
router.get("/fetch-profile/:userId", adminAuth, fetchUserProfile);
router.get("/all", adminAuth, getAllUsers);
router.get("/username/:telegramId", auth, getUsername);
router.get("/leaderboard", auth, getLeaderboard);
router.get("/overall-leaderboard", auth, getOverallLeaderboard);
router.get("/under-review", adminAuth, getUnderScrutinyTasks);

router.post("/mark-task", auth, markTask);
router.post("/complete-task/:taskId", auth, completeTask);
router.post("/update-task-status", adminAuth, updateTaskStatus);
router.post("/reward-inviter/:inviterId", auth, rewardInviter);
router.post("/update-username", auth, updateUserName);
router.post("/reset-score", adminAuth, resetTaskScore);

router.put("/update/:userId", adminAuth, updateUser);
router.delete("/delete/:userId", adminAuth, deleteUser);

export default router;
