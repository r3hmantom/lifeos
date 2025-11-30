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
