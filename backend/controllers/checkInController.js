const { db, snapshotToArray } = require('../config/firebase');

const COLLECTION = 'checkins';

// Get check-ins
exports.getCheckIns = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;

    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    let checkIns = snapshotToArray(snapshot);

    if (date) {
      const targetStart = new Date(date);
      targetStart.setHours(0, 0, 0, 0);
      const targetEnd = new Date(date);
      targetEnd.setHours(23, 59, 59, 999);
      checkIns = checkIns.filter((c) => {
        const d = new Date(c.date);
        return d >= targetStart && d <= targetEnd;
      });
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      checkIns = checkIns.filter((c) => {
        const d = new Date(c.date);
        return d >= start && d <= end;
      });
    }

    // Sort by date desc
    checkIns.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(checkIns);
  } catch (error) {
    console.error('getCheckIns error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create check-in
exports.createCheckIn = async (req, res) => {
  try {
    // Check if check-in already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const existing = snapshotToArray(snapshot).find((c) => {
      const d = new Date(c.date);
      return d >= today && d <= endOfDay;
    });

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInData = {
      ...req.body,
      userId: req.userId,
      date: req.body.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(checkInData);
    res.status(201).json({ _id: docRef.id, ...checkInData });
  } catch (error) {
    console.error('createCheckIn error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get weekly summary
exports.getWeeklySummary = async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const checkIns = snapshotToArray(snapshot).filter((c) => {
      const d = new Date(c.date);
      return d >= startDate && d <= endDate;
    });

    checkIns.sort((a, b) => new Date(a.date) - new Date(b.date));

    const summary = {
      totalDays: checkIns.length,
      moodDistribution: {},
      taskFeelingDistribution: {},
    };

    checkIns.forEach((c) => {
      summary.moodDistribution[c.mood] = (summary.moodDistribution[c.mood] || 0) + 1;
      summary.taskFeelingDistribution[c.taskFeeling] =
        (summary.taskFeelingDistribution[c.taskFeeling] || 0) + 1;
    });

    res.json(summary);
  } catch (error) {
    console.error('getWeeklySummary error:', error);
    res.status(500).json({ error: error.message });
  }
};
