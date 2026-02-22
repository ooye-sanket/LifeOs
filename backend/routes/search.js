const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

router.use(authenticate);

router.get('/', searchController.globalSearch);

module.exports = router;
