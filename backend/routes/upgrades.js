const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upgradeController = require('../controllers/upgradeController');

router.use(authenticate);

router.get('/', upgradeController.getUpgrades);
router.post('/', upgradeController.createUpgrade);
router.post('/:id/log', upgradeController.addDailyLog);
router.delete('/:id', upgradeController.deleteUpgrade);

module.exports = router;
