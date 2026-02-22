const { db, snapshotToArray } = require('../config/firebase');

const COLLECTION = 'places';

// Get all places
exports.getPlaces = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const places = snapshotToArray(snapshot);
    places.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(places);
  } catch (error) {
    console.error('getPlaces error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create place
exports.createPlace = async (req, res) => {
  try {
    const placeData = {
      ...req.body,
      userId: req.userId,
      category: req.body.category || 'Other',
      color: req.body.color || '#b00eb9',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(placeData);
    res.status(201).json({ _id: docRef.id, ...placeData });
  } catch (error) {
    console.error('createPlace error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update place
exports.updatePlace = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Place not found' });
    }

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('updatePlace error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete place
exports.deletePlace = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Place not found' });
    }

    await docRef.delete();
    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    console.error('deletePlace error:', error);
    res.status(500).json({ error: error.message });
  }
};
