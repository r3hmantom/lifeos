const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/', memoryController.createMemory);
router.get('/', memoryController.getMemories);
router.post('/search', memoryController.searchMemories);

module.exports = router;

