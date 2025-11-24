const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard data and statistics
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get main dashboard data
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard data including daily plan, next task, and overview stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 dailyPlan:
 *                   type: object
 *                 nextTask:
 *                   type: object
 *                 overview:
 *                   type: object
 *                   properties:
 *                     UNI:
 *                       type: integer
 *                     FITNESS:
 *                       type: integer
 *                     WORK:
 *                       type: integer
 *                     LIFE:
 *                       type: integer
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/', dashboardController.getDashboard);

/**
 * @swagger
 * /dashboard/stats/{module}:
 *   get:
 *     summary: Get statistics for a specific module
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *           enum: [UNI, WORK, FITNESS, LIFE]
 *         description: The module to get stats for
 *     responses:
 *       200:
 *         description: Module statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   type: string
 *                 upcoming:
 *                   type: array
 *                   items:
 *                     type: object
 *                 recentLogs:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/stats/:module', dashboardController.getModuleStats);

module.exports = router;

