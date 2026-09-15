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
 *       **New Chat**: If `chatId` is not provided, creates a new chat session. Send all messages in the conversation.
 *       
 *       **Continue Chat**: If `chatId` is provided, continues an existing conversation. The backend automatically loads all previous messages from the database. You only need to send the new user message(s) in the `messages` array.
 *       
 *       Supported Intents:
 *       - `chat`: Standard conversation
 *       - `schedule_generated`: Returns a proposed schedule (does not save automatically)
 *       - `schedule_modified`: Modifies existing schedule items (saves automatically)
 *       - `goal_proposed`: Returns a proposed goal object (does not save automatically)
 *       - `memory_proposed`: Returns a proposed memory object (does not save automatically)
 *       
 *       All messages are automatically saved to the database after processing.
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
 *         description: Assistant response with chatId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: At least one message is required
 *       404:
 *         description: Chat not found (when chatId is provided but doesn't exist)
 */
router.post("/chat", authMiddleware, assistantController.chat);

/**
 * @swagger
 * /assistant/chats:
 *   get:
 *     summary: Get all chat conversations for the authenticated user
 *     description: Returns a list of all chat conversations, ordered by most recently updated
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of chats to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of chats to skip
 *     responses:
 *       200:
 *         description: List of chats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 */
router.get("/chats", authMiddleware, assistantController.getChats);

/**
 * @swagger
 * /assistant/chats:
 *   post:
 *     summary: Create a new chat conversation
 *     description: Creates a new empty chat conversation
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Optional title for the chat
 *     responses:
 *       200:
 *         description: Created chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 */
router.post("/chats", authMiddleware, assistantController.createChat);

/**
 * @swagger
 * /assistant/chats/{chatId}:
 *   get:
 *     summary: Get messages for a specific chat
 *     description: Returns all messages in a chat conversation
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: Chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chatId:
 *                   type: string
 *                   format: uuid
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *       404:
 *         description: Chat not found
 */
router.get("/chats/:chatId", authMiddleware, assistantController.getChatMessages);

/**
 * @swagger
 * /assistant/chats/{chatId}:
 *   put:
 *     summary: Update chat title
 *     description: Updates the title of a chat conversation
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: New title for the chat
 *     responses:
 *       200:
 *         description: Updated chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       404:
 *         description: Chat not found
 *       400:
 *         description: Title is required
 */
router.put("/chats/:chatId", authMiddleware, assistantController.updateChat);

/**
 * @swagger
 * /assistant/chats/{chatId}:
 *   delete:
 *     summary: Delete a chat conversation
 *     description: Permanently deletes a chat conversation and all its messages
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat deleted successfully
 *       404:
 *         description: Chat not found
 */
router.delete("/chats/:chatId", authMiddleware, assistantController.deleteChat);

module.exports = router;
