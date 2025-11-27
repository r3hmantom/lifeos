const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetableController");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Timetable
 *   description: Timetable management endpoints
 */

/**
 * @swagger
 * /timetable:
 *   get:
 *     summary: Get all timetable slots
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of timetable slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimetableTemplateResponse'
 */
router.get("/", authMiddleware, timetableController.getAllSlots);

/**
 * @swagger
 * /timetable:
 *   post:
 *     summary: Create a new timetable slot
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - time
 *               - activity
 *             properties:
 *               time:
 *                 type: string
 *                 description: HH:mm format
 *               activity:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Created timetable slot
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimetableSlot'
 */
router.post("/", authMiddleware, timetableController.createSlot);

/**
 * @swagger
 * /timetable/{id}:
 *   patch:
 *     summary: Update a timetable slot
 *     tags: [Timetable]
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
 *               time:
 *                 type: string
 *               activity:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated timetable slot
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimetableSlot'
 *       404:
 *         description: Slot not found
 */
router.patch("/:id", authMiddleware, timetableController.updateSlot);

/**
 * @swagger
 * /timetable/{id}:
 *   delete:
 *     summary: Delete a timetable slot
 *     tags: [Timetable]
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
 *         description: Slot deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Slot not found
 */
router.delete("/:id", authMiddleware, timetableController.deleteSlot);

module.exports = router;
