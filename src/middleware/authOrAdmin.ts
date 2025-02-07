import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const ADMIN_JWT_SECRET =
  process.env.JWT_ADMIN_SECRET || "secret_token_for_jwt_admin";

const prisma = new PrismaClient();

export const authOrAdmin: RequestHandler = async (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    console.log("no token");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let decoded;
    let logger;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      logger = await prisma.users.findUnique({
        where: { id: (decoded as { userId: number }).userId },
      });
    } catch (err) {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
      logger = await prisma.admin.findUnique({
        where: { id: (decoded as { adminId: number }).adminId },
      });
    }

    if (!logger) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
};
