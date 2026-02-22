const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const placeController = require('../controllers/placeController');

router.use(authenticate);

router.get('/', placeController.getPlaces);
router.post('/', placeController.createPlace);
router.put('/:id', placeController.updatePlace);
router.delete('/:id', placeController.deletePlace);

module.exports = router;
