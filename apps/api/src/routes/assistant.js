const express = require("express");
const router = express.Router();
const assistantController = require("../controllers/assistantController");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Assistant
 *   description: AI Assistant endpoints
 */

/**
 * @swagger
 * /assistant/chat:
 *   post:
 *     summary: Chat with the AI assistant for schedule planning
 *     description: |
 *       Interact with the AI to plan schedules, add goals, or create memories.
 *       
 *       Supported Intents:
 *       - `chat`: Standard conversation
 *       - `schedule_generated`: Returns a proposed schedule (does not save automatically)
 *       - `schedule_modified`: Modifies existing schedule items (saves automatically)
 *       - `goal_proposed`: Returns a proposed goal object (does not save automatically)
 *       - `memory_proposed`: Returns a proposed memory object (does not save automatically)
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Assistant response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 */
router.post("/chat", authMiddleware, assistantController.chat);

module.exports = router;
