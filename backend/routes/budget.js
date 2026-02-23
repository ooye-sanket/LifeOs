const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

router.use(authenticate);

router.get('/', budgetController.getBudget);
router.post('/', budgetController.setBudget);
router.get('/alert', budgetController.checkBudgetAlert);

module.exports = router;