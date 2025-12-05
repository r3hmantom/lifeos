const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard endpoints
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get main dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
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
 *                   properties:
 *                     schedule:
 *                       type: array
 *                       items:
 *                         type: object
 *                 nextTask:
 *                   type: object
 *                 overview:
 *                   type: object
 *                   properties:
 *                     UNI:
 *                       type: integer
 *                     WORK:
 *                       type: integer
 *                     FITNESS:
 *                       type: integer
 *                     LIFE:
 *                       type: integer
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", authMiddleware, dashboardController.getDashboard);

/**
 * @swagger
 * /dashboard/stats/{module}:
 *   get:
 *     summary: Get stats for a specific module
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *           enum: [UNI, WORK, FITNESS, LIFE]
 *     responses:
 *       200:
 *         description: Module stats
 */
router.get("/stats/:module", authMiddleware, dashboardController.getStats);

/**
 * @swagger
 * /dashboard/insights:
 *   get:
 *     summary: Get dashboard insights for mobile app
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard insights data
 */
const insightsController = require("../controllers/insightsController");
router.get("/insights", authMiddleware, insightsController.getDashboardInsights);

module.exports = router;

