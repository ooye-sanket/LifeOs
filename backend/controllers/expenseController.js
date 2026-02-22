const { db, snapshotToArray } = require('../config/firebase');

const COLLECTION = 'expenses';

// Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = db.collection(COLLECTION).where('userId', '==', req.userId);

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    let expenses = snapshotToArray(snapshot);

    // Filter by date range in memory
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      expenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }

    // Sort by date desc
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(expenses);
  } catch (error) {
    console.error('getExpenses error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      userId: req.userId,
      paymentMode: req.body.paymentMode || 'UPI',
      date: req.body.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(expenseData);
    res.status(201).json({ _id: docRef.id, ...expenseData });
  } catch (error) {
    console.error('createExpense error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const allExpenses = snapshotToArray(snapshot);

    // Filter by date range
    const expenses = allExpenses.filter((e) => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });

    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {});

    res.json({ total, byCategory, count: expenses.length });
  } catch (error) {
    console.error('getMonthlySummary error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('updateExpense error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await docRef.delete();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ error: error.message });
  }
};
