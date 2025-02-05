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
} from "../controllers/userController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/profile", auth, getUserProfile);
router.post("/complete-task/:taskId", auth, completeTask);
router.get("/leaderboard", auth, getLeaderboard);
router.post("/reward-inviter", auth, rewardInviter);
router.delete("/delete/:userId", adminAuth, deleteUser);
router.put("/update/:userId", adminAuth, updateUser);
router.get("/all", adminAuth, getAllUsers);
router.post("/reset-score", adminAuth, resetTaskScore);

export default router;
