const { db, snapshotToArray } = require('../config/firebase');

const COLLECTION = 'upgrades';

// Get all upgrades
exports.getUpgrades = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const upgrades = snapshotToArray(snapshot);
    upgrades.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    res.json(upgrades);
  } catch (error) {
    console.error('getUpgrades error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create upgrade
exports.createUpgrade = async (req, res) => {
  try {
    const upgradeData = {
      ...req.body,
      userId: req.userId,
      startDate: new Date().toISOString(),
      dailyLogs: [],
      active: true,
      completed: false,
    };

    const docRef = await db.collection(COLLECTION).add(upgradeData);
    res.status(201).json({ _id: docRef.id, ...upgradeData });
  } catch (error) {
    console.error('createUpgrade error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add daily log to upgrade
exports.addDailyLog = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Upgrade not found' });
    }

    const upgrade = doc.data();
    const dailyLogs = upgrade.dailyLogs || [];
    dailyLogs.push({
      date: new Date().toISOString(),
      status: req.body.status,
      note: req.body.note || '',
    });

    // Check if upgrade is completed
    const completed = dailyLogs.length >= upgrade.duration;

    await docRef.update({ dailyLogs, completed, active: !completed });

    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('addDailyLog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete upgrade
exports.deleteUpgrade = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Upgrade not found' });
    }

    await docRef.delete();
    res.json({ message: 'Upgrade deleted successfully' });
  } catch (error) {
    console.error('deleteUpgrade error:', error);
    res.status(500).json({ error: error.message });
  }
};
