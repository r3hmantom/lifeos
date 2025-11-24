const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const auth = require('../middlewares/auth');

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Planner
 *   description: AI Planner generation
 */

/**
 * @swagger
 * /planner:
 *   post:
 *     summary: Generate a daily plan
 *     tags: [Planner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date for the plan (YYYY-MM-DD)
 *               user_intent:
 *                 type: string
 *                 description: Optional specific intent for the day
 *     responses:
 *       200:
 *         description: Generated plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyPlan:
 *                   type: object
 *                   description: The generated schedule
 *                 date:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/', plannerController.generatePlan);

module.exports = router;
