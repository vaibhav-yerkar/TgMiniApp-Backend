import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

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
 *         - score
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         score:
 *           type: integer
 *         dailyTasks:
 *           type: Tasks
 *         OnceTasks:
 *           type: Tasks
 */

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
        dailyTasks: true,
        onceTasks: true,
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
      include: { dailyTasks: true, onceTasks: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const isTaskCompleted =
      task.type === "DAILY"
        ? user.dailyTasks.some((t) => t.id === taskId)
        : user.onceTasks.some((t) => t.id === taskId);
    if (isTaskCompleted) {
      res.status(400).json({ error: "Task already completed" });
      return;
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        score: user.score + task.points,
        dailyTasks:
          task.type === "DAILY" ? { connect: { id: taskId } } : undefined,
        onceTasks:
          task.type === "ONCE" ? { connect: { id: taskId } } : undefined,
      },
      include: { dailyTasks: true, onceTasks: true },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/leaderboard:
 *   get:
 *     summary: Get Leaderboard
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
      select: { id: true, username: true, score: true },
      orderBy: { score: "desc" },
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
      include: {
        dailyTasks: true,
        onceTasks: true,
      },
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
 *               score:
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
        id: undefined,
      },
      include: {
        dailyTasks: true,
        onceTasks: true,
      },
    });
    res.json(updatedUser);
    return;
  } catch (error) {
    res.json({ error: "Internal server error" });
  }
};
