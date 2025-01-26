import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_ADMIN_SECRET || "secret_token_for_jwt_admin";

export const adminAuth: RequestHandler = async (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await prisma.admin.findUnique({
      where: { id: (decoded as { adminId: number }).adminId },
    });

    if (!admin) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
};
