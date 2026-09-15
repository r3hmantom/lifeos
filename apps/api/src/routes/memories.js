const express = require("express");
const router = express.Router();
const memoryController = require("../controllers/memoryController");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Memories
 *   description: Memory management endpoints
 */

/**
 * @swagger
 * /memories:
 *   get:
 *     summary: Get all user memories
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of memories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Memory'
 */
router.get("/", authMiddleware, memoryController.getAllMemories);

/**
 * @swagger
 * /memories:
 *   post:
 *     summary: Create a new memory/commitment
 *     tags: [Memories]
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
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Memory created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Memory'
 */
router.post("/", authMiddleware, memoryController.createMemory);

/**
 * @swagger
 * /memories/{id}:
 *   patch:
 *     summary: Update a memory
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Memory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Memory'
 */
router.patch("/:id", authMiddleware, memoryController.updateMemory);

/**
 * @swagger
 * /memories/{id}:
 *   delete:
 *     summary: Delete a memory
 *     tags: [Memories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Memory deleted successfully
 */
router.delete("/:id", authMiddleware, memoryController.deleteMemory);

module.exports = router;
