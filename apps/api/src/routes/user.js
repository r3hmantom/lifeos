const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile management
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 preferences:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /user/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               preferences:
 *                 type: object
 *                 description: User preferences object
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 preferences:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.put('/preferences', userController.updatePreferences);

module.exports = router;

