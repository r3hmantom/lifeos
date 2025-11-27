const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goalController");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Goal management endpoints
 */

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: Get all user goals
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Goal'
 */
router.get("/", authMiddleware, goalController.getAllGoals);

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
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
 *               - focus
 *               - deadline
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *               focus:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [High, Medium, Low]
 *     responses:
 *       200:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 */
router.post("/", authMiddleware, goalController.createGoal);

module.exports = router;
