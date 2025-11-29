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
 * /schedule:
 *   post:
 *     summary: Create a new schedule item manually
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleItem'
 *     responses:
 *       200:
 *         description: Created schedule item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleItem'
 */
router.post("/", authMiddleware, scheduleController.createScheduleItem);

/**
 * @swagger
 * /schedule/{id}:
 *   patch:
 *     summary: Update a schedule item
 *     tags: [Schedule]
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
 *             $ref: '#/components/schemas/ScheduleItem'
 *     responses:
 *       200:
 *         description: Updated schedule item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleItem'
 */
router.patch("/:id", authMiddleware, scheduleController.updateScheduleItem);

/**
 * @swagger
 * /schedule/{id}:
 *   delete:
 *     summary: Delete a schedule item
 *     tags: [Schedule]
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
 *         description: Item deleted successfully
 */
router.delete("/:id", authMiddleware, scheduleController.deleteScheduleItem);

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
