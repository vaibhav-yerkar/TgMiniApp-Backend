import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_ADMIN_SECRET || "secret_token_for_jwt_admin";

/**
 * @swagger
 * /admin/register:
 *   post:
 *     summary: Register a admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               username:
 *                 type: string
 *               password:
 *                  type: string
 *             example:
 *               username: john_doe
 *               password: password
 *     responses:
 *       200:
 *         description: Admin registered successfully
 *       400:
 *         description: Admin already exists
 */

export const adminRegister: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });
    if (existingAdmin) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { username, password: hashedPassword },
    });

    const token = jwt.sign({ adminId: admin.id }, JWT_SECRET);
    res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Login a admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               username:
 *                 type: string
 *               password:
 *                  type: string
 *             example:
 *               username: john_doe
 *               password: password
 *     responses:
 *       200:
 *         description: Admin registered successfully
 *       400:
 *         description: Admin already exists
 */
export const adminLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      res.status(400).json({ error: "Invalid username or password" });
      return;
    }
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      res.status(400).json({ error: "Invalid username or password" });
      return;
    }
    const token = jwt.sign({ adminId: admin.id }, JWT_SECRET);
    res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
