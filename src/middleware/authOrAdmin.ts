import { RequestHandler } from "express";
import { auth } from "./auth";
import { adminAuth } from "./admin";

export const authOrAdmin: RequestHandler = (req, res, next) => {
  try {
    auth(req, res, (err) => {
      if (!err) {
        return next();
      }
      adminAuth(req, res, next);
    });
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
