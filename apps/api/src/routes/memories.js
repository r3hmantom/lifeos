const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const auth = require('../middlewares/auth');

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Memories
 *   description: Memory management
 */

/**
 * @swagger
 * /memories:
 *   post:
 *     summary: Create a new memory
 *     tags: [Memories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               module:
 *                 type: string
 *                 enum: [UNI, WORK, FITNESS, LIFE]
 *               type:
 *                 type: string
 *                 enum: [NOTE, TASK, EVENT, LOG]
 *               text:
 *                 type: string
 *                 description: The raw text input
 *               importance:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *               content:
 *                 type: object
 *                 description: Additional structured content
 *     responses:
 *       201:
 *         description: Memory created successfully
 *       500:
 *         description: Server error
 */
router.post('/', memoryController.createMemory);

/**
 * @swagger
 * /memories:
 *   get:
 *     summary: Get recent memories
 *     tags: [Memories]
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           enum: [UNI, WORK, FITNESS, LIFE]
 *         description: Filter by module
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of memories to return
 *     responses:
 *       200:
 *         description: List of memories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   module:
 *                     type: string
 *                   type:
 *                     type: string
 *                   text:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get('/', memoryController.getMemories);

/**
 * @swagger
 * /memories/search:
 *   post:
 *     summary: Search memories
 *     tags: [Memories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query string
 *               module:
 *                 type: string
 *                 enum: [UNI, WORK, FITNESS, LIFE]
 *                 description: Optional filter by module
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   text:
 *                     type: string
 *                   score:
 *                     type: number
 *       500:
 *         description: Server error
 */
router.post('/search', memoryController.searchMemories);

module.exports = router;

