const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const alertController = require('../controllers/alertController');

router.use(authenticate);

router.get('/', alertController.getAlerts);
router.post('/', alertController.createAlert);
router.put('/:id/read', alertController.markAsRead);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
