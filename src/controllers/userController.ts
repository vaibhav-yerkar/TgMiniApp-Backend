import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import {
  sendNotification,
  sendBulkNotifications,
} from "../service/notificationService";
import { getTwitterInfo, fetchFollowers } from "../service/twitterService";
import { connect } from "http2";

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
 * components:
 *   schemas:
 *     TaskComplete:
 *       type: object
 *       required:
 *        - status
 *        - taskId
 *       properties:
 *         id:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, REJECTED, ADMIN_APPROVED]
 *         activity_url:
 *           type: string
 *         image_url:
 *           type: string
 *         taskId:
 *           type: integer
 *         userId:
 *           type: integer
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - telegramId
 *         - inviteLink
 *         - totalScore
 *         - taskScore
 *         - inviteScore
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         telegramId:
 *           type: integer
 *         inviteLink:
 *           type: string
 *         twitterId:
 *           type: integer
 *         twitterUsername:
 *           type: string
 *         totalScore:
 *           type: integer
 *         taskScore:
 *           type: integer
 *         inviteScore:
 *           type: integer
 *         lastResetDate:
 *           type: string
 *           format: date-time
 *         underScrutiny:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TaskComplete'
 *         taskCompleted:
 *           type: array
 *           items:
 *             type: integer
 *         onceTaskCompleted:
 *           type: array
 *           items:
 *             type: integer
 *         Invitees:
 *           type: array
 *           items:
 *             type: integer
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
    const users = await prisma.users.findMany({
      include: {
        underScrutiny: true,
      },
    });
    res.json(JSON.parse(JSON.stringify(users, safeReplacer)));
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
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
      include: {
        underScrutiny: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(JSON.parse(JSON.stringify(user, safeReplacer)));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /user/fetch-profile/{userId}:
 *   get:
 *     summary: Get User profile Admin
 *     tags: [User - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: user ID of the user to get user profile
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *               type: array
 */
export const fetchUserProfile: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId! as string);
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        underScrutiny: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(JSON.parse(JSON.stringify(user, safeReplacer)));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /user/username/{telegramId}:
 *   get:
 *     summary: Get Username by telegram ID
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: integer
 *         description: telegram ID of the user to get username
 *     responses:
 *       200:
 *         description: Username data
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
export const getUsername: RequestHandler = async (req, res) => {
  try {
    const telegramId = parseInt(req.params.telegramId! as string);

    const existingUser = await prisma.users.findUnique({
      where: { telegramId: telegramId },
    });

    if (!existingUser) {
      res.json({ error: "User not found" });
      return;
    }
    res.json(existingUser.username);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
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

    res.json(
      JSON.parse(
        JSON.stringify({ currentUser: userPosition, leaderboard }, safeReplacer)
      )
    );
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
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

    res.json(
      JSON.parse(
        JSON.stringify({ currentUser: userPosition, leaderboard }, safeReplacer)
      )
    );
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /user/under-review:
 *   get:
 *     summary: Get all tasks under scrutiny
 *     tags: [User - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tasks under scrutiny
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       underScrutiny:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/TaskComplete'
 *       500:
 *         description: Internal server error
 */
export const getUnderScrutinyTasks: RequestHandler = async (req, res) => {
  try {
    let users = await prisma.users.findMany({
      select: { underScrutiny: true, telegramId: true },
    });

    users = users.filter((user) => user.underScrutiny.length > 0);

    let tasks = users.flatMap((user) =>
      user.underScrutiny.map((task) => ({
        ...task,
        telegramId: user.telegramId,
      }))
    );

    tasks.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    res
      .status(200)
      .json(JSON.parse(JSON.stringify({ tasks: tasks }, safeReplacer)));
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error " });
    return;
  }
};

/**
 * @swagger
 * /user/twitter-followers:
 *   get:
 *     summary: Get Twitter followers list
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Twitter followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       name:
 *                         type: string
 *       404:
 *         description: User's Twitter information not available or unable to fetch followers list
 *       500:
 *         description: Internal server error
 */

export const getFollowerList: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId as string);
    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user || user.twitterUsername === null) {
      res.status(404).json({ message: "User's twitter Info not available" });
      return;
    }

    const followers = await fetchFollowers(user.twitterUsername);

    if (followers.length === 0) {
      res.status(404).json({ message: "Unable to fetch follower's list" });
      return;
    }

    res.status(200).json({ followers: followers });
  } catch (error) {
    res.status(500).json({ error: "Internal server error " });
  }
};

/**
 * @swagger
 * /user/mark-task:
 *   post:
 *     summary: Mark a task with additional information
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: integer
 *                 description: ID of the task to mark
 *               activity_url:
 *                 type: string
 *                 description: URL related to the activity
 *               image_url:
 *                 type: string
 *                 description: URL of the uploaded image
 *     responses:
 *       200:
 *         description: Task marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 taskComplete:
 *                   type: object
 *       400:
 *         description: Invalid request or task already completed
 *       404:
 *         description: Task or User not found
 */
export const markTask: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId! as string);

    const { taskId, activity_url, image_url } = req.body;
    const status = "PENDING";

    if (!taskId) {
      res.status(400).json({ error: "taskId are required" });
      return;
    }

    const taskIdNum = parseInt(taskId);
    if (isNaN(taskIdNum)) {
      res.status(400).json({ error: "Invalid taskId" });
      return;
    }

    const task = await prisma.tasks.findUnique({ where: { id: taskIdNum } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        underScrutiny: {
          where: { taskId: taskIdNum },
        },
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (task.platform === "TWITTER" || task.platform === "TELEGRAM") {
      let verifyed = false;
      if (task.platform === "TWITTER") {
        verifyed = true;
      } else if (task.platform === "TELEGRAM") {
        verifyed = false;
        let bot_token;
        let chat_id;
        if (task.description?.toLowerCase().includes("community")) {
          bot_token = process.env.TELEGRAM_BOT_TOKEN;
          chat_id = process.env.TELEGRAM_COMMUNITY_CHAT_ID;
        } else if (task.description?.toLowerCase().includes("announcement")) {
          bot_token = process.env.TELEGRAM_BOT_TOKEN;
          chat_id = process.env.TELEGRAM_ANNOUNCEMENT_CHAT_ID;
        }
        const apiResponse = await fetch(
          `https://api.telegram.org/bot${bot_token}/getChatMember?chat_id=${chat_id}&user_id=${user.telegramId}`
        );

        const data = await apiResponse.json();
        if (data.ok) {
          verifyed =
            data.result.status === "member" ||
            data.result.status === "administrator";
        }
      }
      if (!verifyed) {
        res.status(400).json({ error: "Unable to mark task as Complete" });
        return;
      }
      const updateData: any = {
        taskScore: { increment: task.points },
        totalScore: { increment: task.points },
      };
      if (task.type === "DAILY") {
        updateData.taskCompleted = { push: taskId };
      } else {
        updateData.onceTaskCompleted = { push: taskId };
      }

      const updateUser = await prisma.users.update({
        where: { id: userId },
        data: updateData,
        include: {
          underScrutiny: true,
        },
      });
      res.status(200).json(
        JSON.parse(
          JSON.stringify(
            {
              message: "Task completed successfully",
              user: updateUser,
            },
            safeReplacer
          )
        )
      );
      const title = "Task Completed Successfully";
      const message =
        "Reward collected! Great job completing the task. Keep up the awesome work!";
      await sendNotification(userId, title, message);
      return;
    }

    const isTaskCompleted =
      user.taskCompleted.includes(taskIdNum) ||
      user.onceTaskCompleted.includes(taskIdNum);
    if (user.underScrutiny.length > 0 || isTaskCompleted) {
      res.status(400).json({ error: "Task already completed" });
      return;
    }

    let taskData: any = {
      status: status,
      activity_url: activity_url.length > 0 ? activity_url : null,
      image_url: image_url.length > 0 ? image_url : null,
      taskId: taskIdNum,
      userId: userId,
    };

    const taskComplete = await prisma.taskComplete.create({
      data: taskData,
    });

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        underScrutiny: {
          connect: { id: taskComplete.id },
        },
      },
      include: {
        underScrutiny: true,
      },
    });
    res.status(200).json(
      JSON.parse(
        JSON.stringify(
          {
            message: "Task marked successfully",
            user: updatedUser,
          },
          safeReplacer
        )
      )
    );
    const title = "Task Marked for Review";
    const message = `Task "${task.title}" has been marked for review. We will notify you once it has been reviewed.`;
    await sendNotification(userId, title, message);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error " + `${error}` });
    return;
  }
};

/**
 * @swagger
 * /user/complete-task/{taskId}:
 *   post:
 *     summary: Complete a marked task
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
      include: {
        underScrutiny: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isTaskCompleted =
      task.type === "DAILY"
        ? user.taskCompleted.find((id) => id === taskId)
        : user.onceTaskCompleted.find((id) => id === taskId);
    if (isTaskCompleted) {
      res.status(400).json({ error: "Task already completed" });
      return;
    }

    const taskUnderScrutiny = user.underScrutiny.find(
      (ts) => ts.taskId === taskId
    );
    if (!taskUnderScrutiny) {
      res.status(400).json({ error: "Task not marked for review" });
      return;
    }

    if (
      taskUnderScrutiny.status !== "ADMIN_APPROVED" &&
      taskUnderScrutiny.status !== "COMPLETED"
    ) {
      res.status(400).json({ error: "Task under review is not approved yet" });
      return;
    }

    await prisma.taskComplete.delete({ where: { id: taskUnderScrutiny.id } });

    const updateData: any = {
      taskScore: { increment: task.points },
      totalScore: { increment: task.points },
    };

    if (task.type === "DAILY") {
      updateData.taskCompleted = { push: taskId };
    } else {
      updateData.onceTaskCompleted = { push: taskId };
    }

    const updateUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      include: {
        underScrutiny: true,
      },
    });
    res.json(
      JSON.parse(
        JSON.stringify(
          {
            message: "Task completed successfully",
            user: updateUser,
          },
          safeReplacer
        )
      )
    );
    const title = "Task Reward Collected";
    const message =
      "Reward collected! Great job completing the task. Keep up the awesome work! ";
    await sendNotification(userId, title, message);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error " });
    return;
  }
};

/**
 * @swagger
 * /user/update-task-status:
 *   post:
 *     summary: Update the status of a task under review
 *     tags: [User - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - taskId
 *               - status
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user whose task will be updated
 *               taskId:
 *                 type: integer
 *                 description: ID of the task to update in underScrutiny
 *               status:
 *                 type: string
 *                 enum: [REJECTED, ADMIN_APPROVED]
 *                 description: New status to set for the task
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updatedTask:
 *                   $ref: '#/components/schemas/TaskComplete'
 *       400:
 *         description: Invalid request or task not marked for review
 *       404:
 *         description: User not found
 */
export const updateTaskStatus: RequestHandler = async (req, res) => {
  try {
    const { userId, taskId, status } = req.body;

    if (!userId || !taskId || !status) {
      res.status(400).json({ error: "userId, taskId and status are required" });
      return;
    }

    if (!["REJECTED", "ADMIN_APPROVED"].includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const userIdNum = parseInt(userId);
    const taskIdNum = parseInt(taskId);
    if (isNaN(userIdNum) || isNaN(taskIdNum)) {
      res.status(400).json({ error: "Invalid userId or taskId" });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { id: userIdNum },
      include: { underScrutiny: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const taskUnderScrutiny = user.underScrutiny.find(
      (ts) => ts.taskId === taskIdNum
    );
    if (!taskUnderScrutiny) {
      res.status(400).json({ error: "Task not marked for review" });
      return;
    }
    const task = await prisma.tasks.findUnique({ where: { id: taskIdNum } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const updatedTask = await prisma.taskComplete.update({
      where: { id: taskUnderScrutiny.id },
      data: { status: status },
    });

    if (status === "REJECTED") {
      await prisma.users.update({
        where: { id: userIdNum },
        data: {
          underScrutiny: {
            disconnect: { id: taskUnderScrutiny.id },
          },
        },
      });
      await prisma.taskComplete.delete({ where: { id: taskUnderScrutiny.id } });
    }

    res.status(200).json(
      JSON.parse(
        JSON.stringify(
          {
            message: "Task status updated successfully",
            updatedTask,
          },
          safeReplacer
        )
      )
    );
    if (status === "ADMIN_APPROVED") {
      const title = "Task has been verified by admin and ready to collect";
      const message = `Great news! Your task "${task.title}" has been verified. Collect your reward now and celebrate!`;
      await sendNotification(userIdNum, title, message);
    } else {
      const title = "Task has been rejected by admin";
      const message = `Sad news! Your task "${task.title}" has been rejected. Please try again and submit a valid task.`;
      await sendNotification(userIdNum, title, message);
    }
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
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
    const users = await prisma.users.findMany({ select: { id: true } });

    const userIds = users.map((user) => user.id);
    const title = "Task Scores Reset";
    const message =
      "All task scores have been reset. Please start fresh and complete tasks to earn rewards.";

    await sendBulkNotifications(userIds, title, message);

    res.json({
      message: "Task scores reset successfully",
      count: result.count,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
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
      prisma.users.findUnique({ where: { telegramId: BigInt(inviterId) } }),
    ]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (!inviter) {
      res.status(404).json({ error: "Inviter not found" });
      return;
    }

    if (inviter && user) {
      if (inviter.Invitees.includes(user.telegramId)) {
        res.status(400).json({ error: "User already invited" });
        return;
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

        let title = "A new user has joined through your referral link";
        let message =
          "Woohoo! A friend just joined using your referral link. Keep spreading the word and earn more rewards!";
        await sendNotification(inviter.id, title, message);

        if (inviter.Invitees.length === 5) {
          title = "Referral milestones: 5 friends joined!";
          message =
            "You've got 5 friends on board! Keep inviting and unlock more rewards. You're on a roll!";
        } else if (inviter.Invitees.length === 10) {
          title = "Referral milestones: 10 friends joined!";
          message =
            "10 friends joined! You're a referral superstar. Keep it up!";
        } else if (inviter.Invitees.length === 20) {
          title = "Referral milestones: 20 friends joined!";
          message = "20 friends are now part of the fun! You're unstoppable!";
        } else if (inviter.Invitees.length === 50) {
          title = "Referral milestones: 50 friends joined!";
          message =
            "50 friends?! You're a referral legend! Keep growing your squad!";
        } else if (inviter.Invitees.length === 100) {
          title = "Referral milestones: 100 friends joined!";
          message =
            "100 friends joined! You're the ultimate referral champion!";
        } else {
          title = "";
          message = "";
        }
        if (title.length > 0 && message.length > 0) {
          await sendNotification(inviter.id, title, message);
        }

        res.json(
          JSON.parse(
            JSON.stringify(
              {
                message: "Inviter rewarded successfully",
                inviter: updatedInviter,
              },
              safeReplacer
            )
          )
        );
        return;
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
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
    res.json(JSON.parse(JSON.stringify(updatedUser, safeReplacer)));
    return;
  } catch (error) {
    res.json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /user/update-username:
 *   put:
 *     summary: Update User Name
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
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
export const updateUserName: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { username } = req.body;

    const user = await prisma.users.update({
      where: { id: userId },
      data: { username },
    });

    res.json(JSON.parse(JSON.stringify(user, safeReplacer)));
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /user/update-twitterInfo/{userName}:
 *   put:
 *     summary: update User profile - add user's twitter Info
 *     tags: [User - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *         description: twitter username of the user
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
export const updateTwitterInfo: RequestHandler = async (req, res) => {
  try {
    const userId = parseInt(req.userId as string);
    const userName = req.params.userName as string;

    const userInfo = await getTwitterInfo(userName);
    if (userInfo.id === BigInt(0) || userInfo.name == "") {
      res.status(404).json({ message: "Unable to fetch userInfo" });
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        twitterId: userInfo.id as unknown as bigint,
        twitterUsername: userInfo.name,
      },
    });

    res.status(200).json(JSON.stringify(user, safeReplacer));
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal Server error" });
    return;
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
    await prisma.taskComplete.deleteMany({
      where: { userId: userId },
    });
    await prisma.users.delete({
      where: { id: userId },
    });
    res.json({ message: "User deleted successfully" });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
