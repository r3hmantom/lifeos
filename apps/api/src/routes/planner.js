const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/', plannerController.generatePlan);

module.exports = router;
