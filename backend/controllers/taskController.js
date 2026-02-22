const { db, snapshotToArray } = require('../config/firebase');
const COLLECTION = 'tasks';

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const { date } = req.query;

    const snapshot = await db.collection(COLLECTION).where('userId', '==', req.userId).get();
    let tasks = snapshotToArray(snapshot);

    if (date) {
      // Parse YYYY-MM-DD as local date to avoid timezone shift
      const [year, month, day] = date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
      tasks = tasks.filter(t => t.date >= startDate && t.date <= endDate);
    }

    // Sort by date asc, priority desc
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    tasks.sort((a, b) => {
      const dateSort = new Date(a.date) - new Date(b.date);
      if (dateSort !== 0) return dateSort;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });

    res.json(tasks);
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      userId: req.userId,
      completed: false,
      isImportant: false,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection(COLLECTION).add(taskData);
    res.status(201).json({ _id: docRef.id, ...taskData });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await docRef.update({ ...req.body, updatedAt: new Date().toISOString() });
    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle task completion
exports.toggleTask = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const newCompleted = !doc.data().completed;
    await docRef.update({
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : null,
    });
    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('toggleTask error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle important
exports.toggleImportant = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await docRef.update({ isImportant: !doc.data().isImportant });
    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('toggleImportant error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await docRef.delete();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ error: error.message });
  }
};