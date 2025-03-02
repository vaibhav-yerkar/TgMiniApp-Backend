import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { sendBulkNotifications } from "../service/notificationService";

const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - cta
 *         - link
 *         - type
 *         - points
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         cta:
 *           type: string
 *           default: "Complete"
 *         description:
 *           type: string
 *           nullable: true
 *         link:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *         submitType:
 *           type: string
 *           enum: [NONE, LINK, IMAGE, BOTH]
 *           default: NONE
 *         type:
 *           type: string
 *           enum: [DAILY, ONCE]
 *         points:
 *           type: integer
 *         isUploadRequired:
 *           type: boolean
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
export const getAllTasks: RequestHandler = async (req, res): Promise<void> => {
  try {
    const tasks = await prisma.tasks.findMany();
    res.json(tasks);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
export const getTask: RequestHandler = async (req, res): Promise<void> => {
  try {
    const task = await prisma.tasks.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /tasks/daily:
 *   get:
 *     summary: Get all daily tasks
 *     tags: [Tasks - User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of daily tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
export const getDailyTasks: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const tasks = await prisma.tasks.findMany({
      where: {
        type: "DAILY",
      },
    });
    res.json(tasks);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /tasks/once:
 *   get:
 *     summary: Get all one-time tasks
 *     tags: [Tasks - User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of one-time tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
export const getOnceTasks: RequestHandler = async (req, res): Promise<void> => {
  try {
    const tasks = await prisma.tasks.findMany({
      where: {
        type: "ONCE",
      },
    });
    res.json(tasks);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks - Admin]
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
 *               - link
 *               - type
 *               - points
 *             properties:
 *               title:
 *                 type: string
 *               cta:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *               image:
 *                 type: string
 *               submitType:
 *                 type: string
 *                 enum: [NONE, LINK, IMAGE, BOTH]
 *               type:
 *                 type: string
 *                 enum: [DAILY, ONCE]
 *               points:
 *                 type: integer
 *               isUploadRequired:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
export const createTask: RequestHandler = async (req, res): Promise<void> => {
  try {
    const task = await prisma.tasks.create({
      data: req.body,
    });

    const users = await prisma.users.findMany({ select: { id: true } });
    const userIds = users.map((user) => user.id);
    const title = "New Task Available!";
    const message =
      "A new task is waiting for you! Complete it and earn your reward. Let's get started!";
    await sendBulkNotifications(userIds, title, message);

    res.json(task);
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               cta:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *               image:
 *                 type: string
 *               submitType:
 *                 type: string
 *                 enum: [NONE, LINK, IMAGE, BOTH]
 *               type:
 *                 type: string
 *                 enum: [DAILY, ONCE]
 *               points:
 *                 type: integer
 *               isUploadRequired:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
export const updateTask: RequestHandler = async (req, res): Promise<void> => {
  try {
    const task = await prisma.tasks.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(task);
    return;
  } catch (error) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
};

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
export const deleteTask: RequestHandler = async (req, res): Promise<void> => {
  try {
    const task = await prisma.tasks.delete({
      where: { id: Number(req.params.id) },
    });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({ message: "Task deleted successfully" });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};
