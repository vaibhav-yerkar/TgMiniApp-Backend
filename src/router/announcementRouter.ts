import express from "express";
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";
import { authOrAdmin } from "../middleware/authOrAdmin";

const router = express.Router();

router.get("/", authOrAdmin, getAnnouncements);
router.get("/:id", authOrAdmin, getAnnouncementById);

router.post("/", adminAuth, createAnnouncement);

router.put("/:id", adminAuth, updateAnnouncement);
router.delete("/:id", adminAuth, deleteAnnouncement);

export default router;
