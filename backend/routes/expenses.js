const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

router.use(authenticate);

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.get('/summary/:year/:month', expenseController.getMonthlySummary);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
