const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const checkInController = require('../controllers/checkInController');

router.use(authenticate);

router.get('/', checkInController.getCheckIns);
router.post('/', checkInController.createCheckIn);
router.get('/weekly-summary', checkInController.getWeeklySummary);

module.exports = router;
