import express from "express";
import {
  getUserProfile,
  completeTask,
  getLeaderboard,
  deleteUser,
  updateUser,
  getAllUsers,
  resetTaskScore,
  rewardInviter,
  updateUserName,
  getOverallLeaderboard,
  getUsername,
} from "../controllers/userController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/profile", auth, getUserProfile);
router.get("/leaderboard", auth, getLeaderboard);
router.get("/overall-leaderboard", auth, getOverallLeaderboard);
router.get("/username/:userId", auth, getUsername);
router.get("/all", adminAuth, getAllUsers);

router.post("/complete-task/:taskId", auth, completeTask);
router.post("/reward-inviter/:inviterId", auth, rewardInviter);
router.post("/update-username", auth, updateUserName);
router.post("/reset-score", adminAuth, resetTaskScore);

router.put("/update/:userId", adminAuth, updateUser);
router.delete("/delete/:userId", adminAuth, deleteUser);

export default router;
