import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAnnouncement: RequestHandler = (req, res) => {};
