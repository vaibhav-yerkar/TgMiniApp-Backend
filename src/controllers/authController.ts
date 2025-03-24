import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret_token_for_jwt";

const safeReplacer = (_key: string, value: any) => {
  return typeof value === "bigint" ? value.toString() : value;
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - telegramId
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               telegramId:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     telegramId:
 *                       type: string
 *       400:
 *         description: Username already exists
 *       500:
 *         description: Internal server error
 */

export const register: RequestHandler = async (req, res) => {
  try {
    const { username, telegramId } = req.body;
    const inviteLinkBase = process.env.INVITE_LINK_BASE_URL;

    if (!inviteLinkBase) {
      res.status(500).json({ error: "Invite link base URL not configured" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ username }, { telegramId }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        res.status(400).json({ error: "Username already exists" });
        return;
      }
      if (existingUser.telegramId === telegramId) {
        res.status(400).json({ error: "Telegram ID already registered" });
        return;
      }
    }
    const user = await prisma.users.create({
      data: { username, telegramId },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res
      .status(200)
      .json(JSON.parse(JSON.stringify({ token, user }, safeReplacer)));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegramId
 *             properties:
 *               telegramId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid username
 */
export const login: RequestHandler = async (req, res) => {
  try {
    const { telegramId } = req.body;

    const user = await prisma.users.findFirst({
      where: { telegramId },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid telegramId" });
      return;
    }

    const now = new Date();
    const shouldReset = user.lastResetDate
      ? now.getTime() - user.lastResetDate.getTime() > 24 * 60 * 60 * 1000
      : true;

    if (shouldReset) {
      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: {
          taskCompleted: [],
          lastResetDate: now,
        },
      });
      const token = jwt.sign({ userId: updatedUser.id }, JWT_SECRET);
      res
        .status(200)
        .json(JSON.parse(JSON.stringify({ token, user }, safeReplacer)));
    } else {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.status(200).json({ token, user });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
