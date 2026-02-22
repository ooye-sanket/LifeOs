const { db, snapshotToArray } = require('../config/firebase');

exports.globalSearch = async (req, res) => {
  try {
    const { query, filter } = req.query;
    const userId = req.userId;
    const results = { tasks: [], notes: [], documents: [] };

    if (!query) {
      return res.json(results);
    }

    const q = query.toLowerCase();

    // Search tasks
    if (!filter || filter === 'all' || filter === 'completed' || filter === 'checklist') {
      const snapshot = await db.collection('tasks').where('userId', '==', userId).get();
      let tasks = snapshotToArray(snapshot);

      tasks = tasks.filter((t) => t.title && t.title.toLowerCase().includes(q));
      if (filter === 'completed') tasks = tasks.filter((t) => t.completed === true);

      results.tasks = tasks.slice(0, 10);
    }

    // Search notes
    if (!filter || filter === 'all') {
      const snapshot = await db.collection('notes').where('userId', '==', userId).get();
      const notes = snapshotToArray(snapshot);

      results.notes = notes
        .filter(
          (n) =>
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.content && n.content.toLowerCase().includes(q))
        )
        .slice(0, 10);
    }

    // Search documents
    if (!filter || filter === 'all' || filter === 'images' || filter === 'links') {
      const snapshot = await db.collection('documents').where('userId', '==', userId).get();
      let docs = snapshotToArray(snapshot);

      docs = docs.filter((d) => d.title && d.title.toLowerCase().includes(q));
      if (filter === 'images') docs = docs.filter((d) => d.fileType && d.fileType.startsWith('image/'));

      results.documents = docs.slice(0, 10);
    }

    res.json(results);
  } catch (error) {
    console.error('globalSearch error:', error);
    res.status(500).json({ error: error.message });
  }
};
