const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

router.use(authenticate);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.patch('/:id/toggle', taskController.toggleTask);
router.patch('/:id/important', taskController.toggleImportant);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
