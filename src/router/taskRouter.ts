import express from "express";
import {
  getAllTasks,
  getDailyTasks,
  getOnceTasks,
  createTask,
  updateTask,
  deleteTask,
  getTask,
} from "../controllers/taskController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/", auth, adminAuth, getAllTasks);
router.get("/daily", auth, getDailyTasks);
router.get("/once", auth, getOnceTasks);
router.post("/", adminAuth, createTask);
router.put("/:id", adminAuth, updateTask);
router.delete("/:id", adminAuth, deleteTask);
router.get("/:id", auth, adminAuth, getTask);

export default router;
