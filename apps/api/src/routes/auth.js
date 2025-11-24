const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth    = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management (Simplified: Always uses Test User)
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: (Legacy) Register a new user - Returns Test User
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns test user details
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: (Legacy) Login user - Returns Test User
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns test user details
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 preferences:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/me', auth, authController.getMe);

module.exports = router;
