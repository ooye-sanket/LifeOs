const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const noteController = require('../controllers/noteController');

router.use(authenticate);

router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
