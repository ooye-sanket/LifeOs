const { db, snapshotToArray } = require('../config/firebase');

const COLLECTION = 'notes';

// Get all notes
exports.getNotes = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const notes = snapshotToArray(snapshot);
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(notes);
  } catch (error) {
    console.error('getNotes error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create note
exports.createNote = async (req, res) => {
  try {
    const noteData = {
      ...req.body,
      userId: req.userId,
      date: req.body.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(noteData);
    res.status(201).json({ _id: docRef.id, ...noteData });
  } catch (error) {
    console.error('createNote error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update note
exports.updateNote = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await docRef.update({ ...req.body, updatedAt: new Date().toISOString() });
    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('updateNote error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete note
exports.deleteNote = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await docRef.delete();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('deleteNote error:', error);
    res.status(500).json({ error: error.message });
  }
};
