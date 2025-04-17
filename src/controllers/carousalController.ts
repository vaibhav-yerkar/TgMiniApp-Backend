import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const safeReplacer = (_key: string, value: any) => {
  return typeof value === "bigint" ? value.toString() : value;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Carousal:
 *       type: object
 *       required:
 *         - link
 *       properties:
 *         id:
 *           type: integer
 *         link:
 *           type: string
 */

/**
 * @swagger
 * /api/carousal:
 *   get:
 *     summary: Get a list of carousal images
 *     tags: [Carousal]
 *     security:
 *       - bearerAuth: []
 *     description: Returns a list of carousal images[]
 *     responses:
 *       200:
 *         description: List of Carousal Images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   link:
 *                     type: string
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
export const getCarousalList: RequestHandler = async (req, res) => {
  try {
    const images = await prisma.carousal.findMany();
    res.status(200).json(images);
    return;
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/carousal:
 *   post:
 *     summary: upload a carousal images
 *     tags: [Carousal]
 *     security:
 *       - bearerAuth: []
 *     description: Add a image to carousal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *             properties:
 *               link:
 *                 type: string
 *                 description: image link
 *     responses:
 *       200:
 *         description: Image successfully added
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   link:
 *                     type: string
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
export const addCarousalImage: RequestHandler = async (req, res) => {
  try {
    const { link } = req.body;
    const images = await prisma.carousal.create({ data: { link } });
    res.status(200).json(images);
    return;
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/carousal/{imageId}:
 *   delete:
 *     summary: delete a carousal images
 *     tags: [Carousal]
 *     security:
 *       - bearerAuth: []
 *     description: Remove a image to carousal
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the image to remove
 *     responses:
 *       200:
 *         description: Image successfully removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image successfully removed
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
export const removeCarousalImage: RequestHandler = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId as string);
    const images = await prisma.carousal.delete({ where: { id: imageId } });
    res.status(200).json({ message: "Image Removed Successfully" });
    return;
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
