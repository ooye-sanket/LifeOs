const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const documentController = require('../controllers/documentController');
const { upload } = require('../config/cloudinary');

router.use(authenticate);

router.post('/', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
