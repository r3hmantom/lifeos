const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Schedule
 *   description: Schedule management endpoints
 */

/**
 * @swagger
 * /schedule:
 *   get:
 *     summary: Get the generated schedule for a specific date
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Daily schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScheduleItem'
 */
router.get("/", authMiddleware, scheduleController.getDailySchedule);

/**
 * @swagger
 * /schedule/generate:
 *   post:
 *     summary: Trigger AI to generate a schedule
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleGenerationRequest'
 *     responses:
 *       200:
 *         description: Schedule generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedule:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ScheduleItem'
 */
router.post("/generate", authMiddleware, scheduleController.generateSchedule);

module.exports = router;
