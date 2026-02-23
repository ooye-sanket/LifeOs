const { db } = require('../config/firebase');
const COLLECTION = 'budgets';
const EXPENSES_COLLECTION = 'expenses';

// GET /api/budget — fetch user's current budget
exports.getBudget = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    if (snapshot.empty) {
      return res.json(null);
    }

    // Sort in memory to avoid needing a Firestore composite index
    const docs = snapshot.docs
      .map(d => ({ _id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(docs[0]);
  } catch (error) {
    console.error('getBudget error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/budget — create or update budget
exports.setBudget = async (req, res) => {
  try {
    const { totalAmount, days, rent, phoneBills, emergency, travel } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Total amount is required' });
    }

    const fixed = (Number(rent) || 0) + (Number(phoneBills) || 0) + (Number(emergency) || 0) + (Number(travel) || 0);
    const miscellaneous = Number(totalAmount) - fixed;

    if (miscellaneous < 0) {
      return res.status(400).json({ error: 'Fixed expenses exceed total budget' });
    }

    const budgetData = {
      userId: req.userId,
      totalAmount: Number(totalAmount),
      days: Number(days) || 30,
      rent: Number(rent) || 0,
      phoneBills: Number(phoneBills) || 0,
      emergency: Number(emergency) || 0,
      travel: Number(travel) || 0,
      miscellaneous,
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if existing budget — if so update it
    const existing = await db
      .collection(COLLECTION)
      .where('userId', '==', req.userId)
      .limit(1)
      .get();

    let docRef;
    if (!existing.empty) {
      docRef = existing.docs[0].ref;
      await docRef.update({ ...budgetData });
    } else {
      docRef = await db.collection(COLLECTION).add(budgetData);
    }

    const updated = await docRef.get();
    res.status(201).json({ _id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('setBudget error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/budget/alert — check if any category is hitting its limit
exports.checkBudgetAlert = async (req, res) => {
  try {
    // Get budget
    const budgetSnap = await db
      .collection(COLLECTION)
      .where('userId', '==', req.userId)
      .limit(1)
      .get();

    if (budgetSnap.empty) {
      return res.json({ hasAlert: false, alerts: [] });
    }

    const budget = budgetSnap.docs[0].data();

    // Get expenses from the budget start date
    const startDate = new Date(budget.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + budget.days);

    const expSnap = await db
      .collection(EXPENSES_COLLECTION)
      .where('userId', '==', req.userId)
      .get();

    const allExpenses = expSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
    const expenses = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });

    // Map categories to budget fields
    const categoryMap = {
      Transport: 'travel',
      Bills: 'phoneBills',
      Health: 'emergency',
    };

    // Calculate spend per budget category
    const spent = { rent: 0, phoneBills: 0, emergency: 0, travel: 0, miscellaneous: 0 };

    expenses.forEach(e => {
      const mapped = categoryMap[e.category];
      if (mapped) {
        spent[mapped] += Number(e.amount);
      } else {
        // Food, Shopping, Entertainment, Other → miscellaneous
        spent.miscellaneous += Number(e.amount);
      }
    });

    const alerts = [];
    const fields = ['rent', 'phoneBills', 'emergency', 'travel', 'miscellaneous'];

    fields.forEach(field => {
      const limit = budget[field];
      const used = spent[field];
      if (limit > 0) {
        const percent = (used / limit) * 100;
        if (percent >= 100) {
          alerts.push({ category: field, spent: used, limit, percent: Math.round(percent), exceeded: true });
        } else if (percent >= 80) {
          alerts.push({ category: field, spent: used, limit, percent: Math.round(percent), exceeded: false });
        }
      }
    });

    res.json({
      hasAlert: alerts.length > 0,
      alerts,
      totalSpent: expenses.reduce((s, e) => s + Number(e.amount), 0),
      budget: { ...budget, spent },
    });
  } catch (error) {
    console.error('checkBudgetAlert error:', error);
    res.status(500).json({ error: error.message });
  }
};