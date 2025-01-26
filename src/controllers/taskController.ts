import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - link
 *         - type
 *         - points
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         link:
 *           type: string
 *         type:
 *           type: string
 *           enum: [DAILY, ONCE]
 *         points:
 *           type: integer
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks - User]
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
export const getAllTasks = async (req: Request, res: Response) => {
  const tasks = await prisma.tasks.findMany();
  res.json(tasks);
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
export const getDailyTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.tasks.findMany({
      where: {
        type: "DAILY",
      },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
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
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
export const getOnceTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.tasks.findMany({
      where: {
        type: "ONCE",
      },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
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
 *               - description
 *               - link
 *               - type
 *               - points
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [DAILY, ONCE]
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await prisma.tasks.create({
      data: req.body,
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
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
 *         description: Task ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [DAILY, ONCE]
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await prisma.tasks.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(task);
  } catch (error) {
    res.status(404).json({ error: "Task not found" });
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
 *         description: ID of task to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Task not found"
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await prisma.tasks.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: "Task not found" });
  }
};
