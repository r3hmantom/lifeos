const express = require("express");
const router = express.Router();
const insightsController = require("../controllers/insightsController");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Insights
 *   description: Productivity insights endpoints
 */

/**
 * @swagger
 * /insights:
 *   get:
 *     summary: Get productivity insights and metrics
 *     tags: [Insights]
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
 *         description: Insights data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InsightMetrics'
 */
router.get("/", authMiddleware, insightsController.getInsights);

module.exports = router;
