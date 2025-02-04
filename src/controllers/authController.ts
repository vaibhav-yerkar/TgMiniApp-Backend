import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret_token_for_jwt";

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
 *                 type: integer
 *                 example: 123456789
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
 *                       type: integer
 *       400:
 *         description: Username already exists
 *       500:
 *         description: Internal server error
 */

export const register: RequestHandler = async (req, res) => {
  try {
    const { username, telegramId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    console.log("hello", username);
    const user = await prisma.users.create({
      data: { username, telegramId },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user });
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
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid username
 */
export const login: RequestHandler = async (req, res) => {
  const { username } = req.body;

  const user = await prisma.users.findUnique({ where: { username } });

  if (!user) {
    res.status(401).json({ error: "Invalid username" });
    return;
  }

  res.json({ token: jwt.sign({ userId: user.id }, JWT_SECRET), user });
};
