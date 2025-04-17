import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

import { sendMessageToChat } from "../service/telegramBotService";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const safeReplacer = (_key: string, value: any) => {
  return typeof value === "bigint" ? value.toString() : value;
};

/**
 * @swagger
 * /api/bot/members:
 *   get:
 *     summary: Get community members with whom bot interacted
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     description: Returns a list of community members with their IDs and usernames, inviteLink, Invite[]
 *     responses:
 *       200:
 *         description: List of community members
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */
export const getMemberList: RequestHandler = async (req, res) => {
  try {
    const users = await prisma.inviteTrack.findMany();
    const userData = JSON.parse(JSON.stringify(users, safeReplacer));
    res.status(200).json(userData);
    return;
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/bot/send-message:
 *   post:
 *     summary: Send message to bulk of community users
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: List of user IDs to send the message to
 *               message:
 *                 type: string
 *                 description: Notification message
 *     responses:
 *       200:
 *         description: message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: message sent successfully
 *       400:
 *         description: Bad request - missing or invalid inputs
 *       500:
 *         description: Internal server error
 */
export const sendMessage: RequestHandler = async (req, res) => {
  try {
    const { userIds, message } = req.body;
    const users = await prisma.inviteTrack.findMany({
      where: { id: { in: userIds } },
    });
    users.forEach(async (user) => {
      sendMessageToChat(user.telegramId.toString(), message);
    });
    res.status(200).json({
      message: "Message sent to selected users successfully",
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /api/bot/send-message-all:
 *   post:
 *     summary: Send message to all of community users
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Notification message
 *     responses:
 *       200:
 *         description: message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: message sent successfully
 *       400:
 *         description: Bad request - missing or invalid inputs
 *       500:
 *         description: Internal server error
 */
export const sendMessageAll: RequestHandler = async (req, res) => {
  try {
    const { message } = req.body;
    const users = await prisma.inviteTrack.findMany();

    users.forEach(async (user) => {
      sendMessageToChat(user.telegramId.toString(), message);
    });
    res.status(200).json({
      message: "Message sent to all users successfully",
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /api/bot/edit-response:
 *   post:
 *     summary: Edit Bot response message
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Bot response message
 *     responses:
 *       200:
 *         description: message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: message edited succesfully
 *       400:
 *         description: Bad request - missing or invalid inputs
 *       500:
 *         description: Internal server error
 */
export const EditBotResponse: RequestHandler = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const filePath = path.join(__dirname, "../bot_response.json");

    let botResponse;
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      botResponse = JSON.parse(fileContent);
    } catch (error) {
      console.error("Error reading bot_response.json", error);
      res.status(500).json("Failed to read bot response file");
      return;
    }
    botResponse.start.message = message;
    try {
      fs.writeFileSync(filePath, JSON.stringify(botResponse, null, 2), "utf8");
      console.log("Bot response file updated successfully");
    } catch (error) {
      console.error("Error writing to bot_response.json", error);
      res.status(500).json({ error: "Failed to ypdate bot response file" });
      return;
    }
    res.status(200).json({ message: "Bot response updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
