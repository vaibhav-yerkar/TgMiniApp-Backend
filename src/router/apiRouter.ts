import express from "express";
import { getKeepAlive, getLeaderboardCSV } from "../controllers/apiController";

import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/admin";

const router = express.Router();

router.get("/keep-alive", getKeepAlive);
router.get("/download-ranking", adminAuth, getLeaderboardCSV);

export default router;
