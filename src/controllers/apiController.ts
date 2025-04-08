import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import {
  sendNotification,
  markNotificationAsRead,
  sendBulkNotifications,
} from "../service/notificationService";
import { db } from "../config/firebase";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const prisma = new PrismaClient();

const safeReplacer = (_key: string, value: any) => {
  return typeof value === "bigint" ? value.toString() : value;
};

/**
 * @swagger
 * /api/keep-alive:
 *   get:
 *     summary: Keep alive endpoint
 *     tags: [API]
 *     description: Returns a status 200 to confirm the server is running.
 *     responses:
 *       200:
 *         description: Server is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server is alive
 */

export const getKeepAlive: RequestHandler = async (req, res) => {
  res.status(200).json({ message: "Server is alive" });
};

/**
 * @swagger
 * /api/download-ranking:
 *   get:
 *     summary: Download leaderboard as CSV
 *     tags: [API]
 *     security:
 *       - bearerAuth: []
 *     description: Downloads a CSV file containing the leaderboard data with user rankings
 *     responses:
 *       200:
 *         description: CSV file containing leaderboard data
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *             example: |
 *               Rank, Username, Task Score, Invite Score, Total Score
 *               1, user1, 100, 50, 150
 *               2, user2, 80, 40, 120
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
export const getLeaderboardCSV: RequestHandler = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        username: true,
        taskScore: true,
        totalScore: true,
        inviteScore: true,
      },
      orderBy: {
        totalScore: "desc",
      },
    });

    const usersData = JSON.parse(JSON.stringify(users, safeReplacer));

    const csvHeader = "Rank, Username, Task Score, Invite Score, Total Score\n";

    interface UserData {
      username: string;
      taskScore: number;
      inviteScore: number;
      totalScore: number;
    }

    const csvRows = usersData
      .map((user: UserData, index: number): string => {
        return `${index + 1}, ${user.username}, ${user.taskScore}, ${
          user.inviteScore
        }, ${user.totalScore}`;
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=leaderboard.csv"
    );

    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/test-notification:
 *   post:
 *     summary: Test notification creation
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 */
export const testNotification: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { title, message } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await sendNotification(user.id, title, message);

    const notifications = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const notificationData = notifications.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(
      JSON.parse(
        JSON.stringify(
          {
            message: "Test notification sent successfully",
            notification: notificationData[0],
          },
          safeReplacer
        )
      )
    );
  } catch (error) {
    console.error("Error in test notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/send-notification:
 *   post:
 *     summary: Send bulk notifications to a list of users
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: List of user IDs to send the notification to
 *               title:
 *                 type: string
 *                 description: Title of the notification
 *               message:
 *                 type: string
 *                 description: Notification message
 *     responses:
 *       200:
 *         description: Bulk notifications sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bulk notifications sent successfully
 *       400:
 *         description: Bad request - missing or invalid inputs
 *       500:
 *         description: Internal server error
 */
export const sendNotifications: RequestHandler = async (req, res) => {
  try {
    const { title, message, userIds } = req.body;
    if (!title || !message || !userIds || !Array.isArray(userIds)) {
      res.status(400).json({ error: "Missing or invalid inputs" });
      return;
    }
    // const firebasedIds = await prisma.users.findMany({
    //   where: {
    //     id: { in: userIds },
    //   },
    //   select: { Id: true },
    // });
    // const firebaseIds = firebasedIds
    // .map((user) => user.id)
    // .filter((id): id is string => id !== null);

    await sendBulkNotifications(userIds, title, message);
    res.status(200).json({ message: "Bulk notifications sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/mark-read/{notificationId}:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
export const markAsRead: RequestHandler = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    await markNotificationAsRead(notificationId);

    res
      .status(200)
      .json({ message: "Notification marked as read successfully" });
  } catch (error) {
    console.error("Error in marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
