const { db, snapshotToArray } = require('../config/firebase');

const COLLECTION = 'habits';

// Get all habits
exports.getHabits = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const habits = snapshotToArray(snapshot);
    habits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(habits);
  } catch (error) {
    console.error('getHabits error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create habit
exports.createHabit = async (req, res) => {
  try {
    const habitData = {
      ...req.body,
      userId: req.userId,
      streak: 0,
      longestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(habitData);
    res.status(201).json({ _id: docRef.id, ...habitData });
  } catch (error) {
    console.error('createHabit error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark habit as completed for today
exports.completeHabit = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = doc.data();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const completedDates = habit.completedDates || [];

    // Don't double-complete
    if (completedDates.includes(today)) {
      return res.status(400).json({ error: 'Habit already completed today' });
    }

    completedDates.push(today);

    // Recalculate streak
    let streak = 0;
    const sortedDates = completedDates.sort();
    const checkDate = new Date();
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const d = new Date(sortedDates[i]);
      const diff = Math.floor((checkDate - d) / (1000 * 60 * 60 * 24));
      if (diff <= streak + 1) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    const longestStreak = Math.max(habit.longestStreak || 0, streak);

    await docRef.update({
      completedDates,
      streak,
      longestStreak,
      lastCompleted: new Date().toISOString(),
    });

    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('completeHabit error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete habit
exports.deleteHabit = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    await docRef.delete();
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('deleteHabit error:', error);
    res.status(500).json({ error: error.message });
  }
};
