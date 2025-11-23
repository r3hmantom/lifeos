const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/profile', userController.getProfile);
router.put('/preferences', userController.updatePreferences);

module.exports = router;

