const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const habitController = require('../controllers/habitController');

router.use(authenticate);

router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.patch('/:id/complete', habitController.completeHabit);
router.delete('/:id', habitController.deleteHabit);

module.exports = router;
