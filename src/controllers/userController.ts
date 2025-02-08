import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import {
  verifyChannelMember,
  verifyCommunityMember,
} from "../config/telegramBot";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - telegramId
 *         - inviteLink
 *         - totalScore
 *         - taskScore
 *         - inviteScore
 *         - taskCompleted
 *         - onceTaskCompleted
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         telegramId:
 *           type: integer
 *         inviteLink:
 *           type: string
 *         totalScore:
 *           type: integer
 *         taskScore:
 *           type: integer
 *         inviteScore:
 *           type: integer
 *         taskCompleted:
 *           type: array
 *         onceTaskCompleted:
 *           type: array
 */

/**
 * @swagger
 * /user/all:
 *   get:
 *     summary: Get all users
 *     tags: [User - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const users = await prisma.users.findMany({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get User profile
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *               type: array
 */
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId! as string);
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/overall-leaderboard:
 *   get:
 *     summary: Get Overall Leaderboard
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               $ref: '#/components/schemas/User'
 */
export const getOverallLeaderboard: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId! as string);

    const users = await prisma.users.findMany({
      select: { id: true, username: true, totalScore: true, telegramId: true },
      orderBy: { totalScore: "desc" },
    });

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    const userPosition = leaderboard.find((user) => user.id === userId);

    res.json({ currentUser: userPosition, leaderboard });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/leaderboard:
 *   get:
 *     summary: Get Weekly Leaderboard
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               $ref: '#/components/schemas/User'
 */
export const getLeaderboard: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId! as string);

    const users = await prisma.users.findMany({
      select: { id: true, username: true, taskScore: true, telegramId: true },
      orderBy: { taskScore: "desc" },
    });

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    const userPosition = leaderboard.find((user) => user.id === userId);

    res.json({ currentUser: userPosition, leaderboard });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/complete-task/{taskId}:
 *   post:
 *     summary: Complete a task
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the task to complete
 *     responses:
 *       200:
 *         description: Task completed successfully
 *         content:
 *           application/json:
 *             schema:
 *       400:
 *         description: Task already completed
 *       404:
 *         description: Task or User not found
 */
export const completeTask: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId! as string);
    const taskId = parseInt(req.params.taskId as string);

    const task = await prisma.tasks.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    //TODO: Check if user is a member of the telegram channel (TELEGRAM_CHANNEL_TASK_ID to be implemented)
    if (taskId == parseInt(process.env.TELEGRAM_CHANNEL_TASK_ID as string)) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isMember = await verifyChannelMember(user.username);
      if (!isMember) {
        res.status(400).json({ error: "User not a member of the channel" });
        return;
      }
    }
    //TODO: Check if user is a member of the telegram channel (TELEGRAM_CHANNEL_TASK_ID to be implemented)
    if (taskId == parseInt(process.env.TELEGRAM_COMMUNITY_TASK_ID as string)) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isMember = await verifyCommunityMember(user.username);
      if (!isMember) {
        res.status(400).json({ error: "User not a member of the community" });
        return;
      }
    }

    const isTaskCompleted =
      task.type === "DAILY"
        ? user.taskCompleted.find((id) => id === taskId)
        : user.onceTaskCompleted.find((id) => id === taskId);
    if (isTaskCompleted) {
      res.status(400).json({ error: "Task already completed" });
      return;
    }

    if (task.type === "DAILY") {
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          taskScore: user.taskScore + task.points,
          totalScore: user.totalScore + task.points,
          taskCompleted: {
            push: taskId,
          },
        },
      });
      res.json(updatedUser);
    } else {
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          taskScore: user.taskScore + task.points,
          totalScore: user.totalScore + task.points,
          onceTaskCompleted: {
            push: taskId,
          },
        },
      });
      res.json(updatedUser);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /users/reset-score:
 *   post:
 *     summary: Reset task score for all users
 *     tags: [User - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task scores reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 */
export const resetTaskScore: RequestHandler = async (req, res) => {
  try {
    const result = await prisma.users.updateMany({
      data: {
        taskScore: 0,
        taskCompleted: [],
      },
    });
    res.json({
      message: "Task scores reset successfully",
      count: result.count,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/reward-inviter/{inviterId}:
 *   post:
 *     summary: Reward user for inviting another user
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Telegram ID of the inviter
 *     responses:
 *       200:
 *         description: Inviter rewarded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inviter:
 *                   $ref: '#/components/schemas/User'
 */
export const rewardInviter: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId!);
    const inviterId = parseInt(req.params.inviterId);

    const [user, inviter] = await Promise.all([
      prisma.users.findUnique({ where: { id: userId } }),
      prisma.users.findUnique({ where: { telegramId: inviterId } }),
    ]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
    }
    if (!inviter) {
      res.status(404).json({ error: "Inviter not found" });
    }

    if (inviter && user) {
      if (inviter.Invitees.includes(user.telegramId)) {
        res.status(400).json({ error: "User already invited" });
      } else {
        const updatedInviter = await prisma.users.update({
          where: { id: inviter.id },
          data: {
            inviteScore: {
              increment: parseInt(process.env.INVITE_REWARD_AMOUNT as string),
            },
            totalScore: {
              increment: parseInt(process.env.INVITE_REWARD_AMOUNT as string),
            },
            Invitees: { push: user.telegramId },
          },
        });
        res.json({
          message: "Inviter rewarded successfully",
          inviter: updatedInviter,
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/update/{userId}:
 *   put:
 *     summary: Update User profile
 *     tags: [User - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               totalScore:
 *                 type: integer
 *               taskScore:
 *                 type: integer
 *               inviteScore:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId! as string);
    const updateData = req.body;

    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      res.json({ error: "User not found" });
      return;
    }
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...updateData,
        username: undefined,
        id: undefined,
        telegramId: undefined,
        inviteLink: undefined,
      },
    });
    res.json(updatedUser);
    return;
  } catch (error) {
    res.json({ error: "Internal server error" });
  }
};

export const updateUserName: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { username } = req.body;

    const user = await prisma.users.update({
      where: { id: userId },
      data: { username },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/delete/{userId}:
 *   delete:
 *     summary: Delete User profile
 *     tags: [User - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 */
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId! as string);

    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      res.json({ error: "User not found" });
      return;
    }
    const user = await prisma.users.delete({
      where: { id: userId },
    });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
