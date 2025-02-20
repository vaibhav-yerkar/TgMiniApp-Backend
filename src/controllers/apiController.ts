import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    const csvHeader = "Rank, Username, Task Score, Invite Score, Total Score\n";

    const csvRows = users
      .map((user, index) => {
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
