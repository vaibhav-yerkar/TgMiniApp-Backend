import express from "express";
import {
  getAllTasks,
  getDailyTasks,
  getOnceTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/", auth, getAllTasks);
router.get("/daily", auth, getDailyTasks);
router.get("/once", auth, getOnceTasks);
router.post("/", adminAuth, createTask);
router.put("/:id", adminAuth, updateTask);
router.delete("/:id", adminAuth, deleteTask);

export default router;
