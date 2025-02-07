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
import { authOrAdmin } from "../middleware/authOrAdmin";

const router = express.Router();

router.get("/daily", auth, getDailyTasks);
router.get("/once", auth, getOnceTasks);

router.get("/", authOrAdmin, getAllTasks);
router.get("/:id", authOrAdmin, getTask);

router.post("/", adminAuth, createTask);
router.put("/:id", adminAuth, updateTask);
router.delete("/:id", adminAuth, deleteTask);

export default router;
