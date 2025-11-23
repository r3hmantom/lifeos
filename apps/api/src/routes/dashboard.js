const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', dashboardController.getDashboard);
router.get('/stats/:module', dashboardController.getModuleStats);

module.exports = router;

