import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { sendBulkNotifications } from "../service/notificationService";

const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       required:
 *         - title
 *         - image
 *         - anmtTasks
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         image:
 *           type: string
 *         anmtTasks:
 *           type: array
 *           items:
 *             type: integer
 */

/**
 * @swagger
 * /anmt:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
export const getAnnouncements: RequestHandler = async (req, res) => {
  try {
    const announcemets = await prisma.anmt.findMany();
    res.json(announcemets);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /anmt/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     tags: [Announcements]
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
 *         description: Announcement details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found
 */
export const getAnnouncementById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const announcement = await prisma.anmt.findUnique({
      where: { id },
    });

    if (!announcement) {
      res.status(404).json({ error: "Announcement not found" });
      return;
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /anmt:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements - Admin]
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
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               anmtTasks:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 */
export const createAnnouncement: RequestHandler = async (req, res) => {
  try {
    const { title, description, image, anmtTasks } = req.body;
    const announcement = await prisma.anmt.create({
      data: { title, description, image, anmtTasks: anmtTasks || [] },
    });

    const users = await prisma.users.findMany({ select: { id: true } });
    const userIds = users.map((user) => user.id);
    const notificationTitle = "New Announcement!";
    const message = "Check out the new announcement!";
    await sendBulkNotifications(userIds, notificationTitle, message);

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /anmt/{id}:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcements - Admin]
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
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               anmtTasks:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found
 */
export const updateAnnouncement: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, image, anmtTasks } = req.body;

    const announcement = await prisma.anmt.findUnique({
      where: { id },
    });
    if (!announcement) {
      res.status(404).json({ error: "Announcement not found" });
      return;
    }
    const updatedAnnouncement = await prisma.anmt.update({
      where: { id },
      data: { title, description, image, anmtTasks },
    });
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /anmt/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements - Admin]
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
 *         description: Announcement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Announcement not found
 */
export const deleteAnnouncement: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const announcement = await prisma.anmt.findUnique({
      where: { id },
    });
    if (!announcement) {
      res.status(404).json({ error: "Announcement not found" });
      return;
    }
    await prisma.anmt.delete({
      where: { id },
    });
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
