const { db, snapshotToArray, docToObj } = require('../config/firebase');

const COLLECTION = 'tasks';

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = db.collection(COLLECTION).where('userId', '==', req.userId);

    if (status) {
      query = query.where('completed', '==', status === 'completed');
    }

    const snapshot = await query.get();
    let tasks = snapshotToArray(snapshot);

    // Filter by date if provided (Firestore range queries on string dates work with ISO format)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      tasks = tasks.filter((t) => {
        const taskDate = new Date(t.date);
        return taskDate >= startOfDay && taskDate <= endOfDay;
      });
    }

    // Sort by date asc, then priority
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    tasks.sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
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
      isImportant: req.body.isImportant || false,
      priority: req.body.priority || 'Medium',
      category: req.body.category || 'Personal',
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

    await docRef.update(req.body);
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

    const currentCompleted = doc.data().completed;
    await docRef.update({
      completed: !currentCompleted,
      completedAt: !currentCompleted ? new Date().toISOString() : null,
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

    const currentImportant = doc.data().isImportant || false;
    await docRef.update({ isImportant: !currentImportant });

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
