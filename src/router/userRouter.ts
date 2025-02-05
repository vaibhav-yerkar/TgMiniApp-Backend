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
} from "../controllers/userController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/profile", auth, getUserProfile);
router.get("/leaderboard", auth, getLeaderboard);
router.get("/all", adminAuth, getAllUsers);

router.post("/complete-task/:taskId", auth, completeTask);
router.post("/reward-inviter/:inviterId", auth, rewardInviter);
router.post("/update-username", auth, updateUserName);
router.post("/reset-score", adminAuth, resetTaskScore);

router.put("/update/:userId", adminAuth, updateUser);
router.delete("/delete/:userId", adminAuth, deleteUser);

export default router;
