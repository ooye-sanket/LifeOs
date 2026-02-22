const { db, snapshotToArray } = require('../config/firebase');

const COLLECTION = 'alerts';

// Get all alerts
exports.getAlerts = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const alerts = snapshotToArray(snapshot);
    alerts.sort((a, b) => new Date(a.alertDate) - new Date(b.alertDate));

    res.json(alerts);
  } catch (error) {
    console.error('getAlerts error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create alert
exports.createAlert = async (req, res) => {
  try {
    const alertData = {
      ...req.body,
      userId: req.userId,
      isRead: false,
      priority: req.body.priority || 'Medium',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(alertData);
    res.status(201).json({ _id: docRef.id, ...alertData });
  } catch (error) {
    console.error('createAlert error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark alert as read
exports.markAsRead = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await docRef.update({ isRead: true });
    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete alert
exports.deleteAlert = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await docRef.delete();
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('deleteAlert error:', error);
    res.status(500).json({ error: error.message });
  }
};
