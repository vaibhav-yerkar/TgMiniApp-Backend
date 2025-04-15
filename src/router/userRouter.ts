import express from "express";
import {
  getUserProfile,
  fetchUserProfile,
  getAllUsers,
  getLeaderboard,
  getOverallLeaderboard,
  getUnderScrutinyTasks,
  getFollowingList,
  completeTask,
  updateUser,
  resetTaskScore,
  rewardInviter,
  getUsername,
  markTask,
  updateTaskStatus,
  updateUserName,
  updateTwitterInvitee,
  updateTwitterInfo,
  deleteUser,
  getUserInviteProfile,
  fetchUserInviteProfile,
} from "../controllers/userController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/fetch-profile/:userId", adminAuth, fetchUserProfile);
router.get("/invite-profile/:telegramId", adminAuth, fetchUserInviteProfile);
router.get("/profile", auth, getUserProfile);
router.get("/invite-profile", auth, getUserInviteProfile);
router.get("/username/:telegramId", auth, getUsername);
router.get("/leaderboard", auth, getLeaderboard);
router.get("/overall-leaderboard", auth, getOverallLeaderboard);
router.get("/twitter-followings", auth, getFollowingList);
router.get("/all", adminAuth, getAllUsers);
router.get("/under-review", adminAuth, getUnderScrutinyTasks);

router.post("/mark-task", auth, markTask);
router.post("/complete-task/:taskId", auth, completeTask);
router.post("/reward-inviter/:referCode", auth, rewardInviter);
router.post("/update-invitee/:twitterId", auth, updateTwitterInvitee);
router.post("/reset-score", adminAuth, resetTaskScore);
router.post("/update-task-status", adminAuth, updateTaskStatus);

router.put("/update-username", auth, updateUserName);
router.put("/update-twitterInfo/:userName", auth, updateTwitterInfo);
router.put("/update/:userId", adminAuth, updateUser);
router.delete("/delete/:userId", adminAuth, deleteUser);

export default router;
