import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import {
  sendNotification,
  sendBulkNotifications,
} from "../service/notificationService";
import { connect } from "http2";

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
      include: {
        underScrutiny: true,
      },
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
    // const { taskId, status, activity_url, image_url } = req.body;
    const { taskId, activity_url, image_url } = req.body;
    const status = "PENDING";

    // if (!["PENDING", "COMPLETED"].includes(status)) {
    //   res.status(400).json({ error: "Invalid status value" });
    //   return;
    // }
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

    // if (status === "COMPLETED") {
    //   updateData.taskScore = { increment: task.points };
    //   updateData.totalScore = { increment: task.points };
    //   if (task.type === "DAILY") {
    //     updateData.taskCompleted = { push: taskIdNum };
    //   } else {
    //     updateData.onceTaskCompleted = { push: taskIdNum };
    //   }
    // } else if (status === "PENDING") {
    //   const taskComplete = await prisma.taskComplete.create({
    //     data: taskData,
    //   });
    //   updateData.underScrutiny = {
    //     connect: { id: taskComplete.id },
    //   };
    // }

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
    res.status(200).json({
      message: "Task marked successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
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
    res.json({
      message: "Task completed successfully",
      user: updateUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error " });
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

    const updatedTask = await prisma.taskComplete.update({
      where: { id: taskUnderScrutiny.id },
      data: { status: status },
    });

    res.status(200).json({
      message: "Task status updated successfully",
      updatedTask,
    });
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
    prisma.users.delete({
      where: { id: userId },
    });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
