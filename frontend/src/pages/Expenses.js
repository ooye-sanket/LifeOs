import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoTrashOutline } from 'react-icons/io5';
import api from '../config/api';
import './Expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    subcategory: '',
    paymentMode: 'UPI',
    description: '',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const response = await api.get(
        `/expenses?startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`
      );
      setExpenses(response.data);

      const total = response.data.reduce((sum, exp) => sum + exp.amount, 0);
      setMonthlyTotal(total);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) return;

    try {
      await api.post('/expenses', {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: new Date(),
      });
      setNewExpense({ 
        amount: '', 
        category: 'Food', 
        subcategory: '', 
        paymentMode: 'UPI', 
        description: '' 
      });
      setShowAddExpense(false);
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    
    try {
      await api.delete(`/expenses/${expenseId}`);
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const groupExpensesByDate = () => {
    const grouped = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(expense);
    });
    return grouped;
  };

  const groupedExpenses = groupExpensesByDate();

  return (
    <div className="page expenses-page">
      <div className="page-header">
        <h1 className="page-title">Money</h1>
        <p className="page-subtitle">Track your spending</p>
      </div>

      {/* Monthly Summary */}
      <div className="monthly-summary">
        <div className="summary-label">This Month</div>
        <div className="summary-amount">₹{monthlyTotal.toLocaleString()}</div>
        <div className="summary-meta">{expenses.length} transactions</div>
      </div>

      {/* Expenses List */}
      <div className="expenses-list">
        {Object.keys(groupedExpenses).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3 className="empty-state-title">No expenses yet</h3>
            <p className="empty-state-text">Start tracking your spending</p>
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([date, dayExpenses]) => (
            <div key={date} className="expense-group">
              <div className="expense-date">{date}</div>
              {dayExpenses.map(expense => (
                <div key={expense._id} className="expense-item">
                  <div className="expense-details">
                    <div className="expense-category">{expense.category}</div>
                    {expense.description && (
                      <div className="expense-description">{expense.description}</div>
                    )}
                    <div className="expense-meta">
                      <span className="payment-badge">{expense.paymentMode}</span>
                      {expense.subcategory && (
                        <span className="subcategory-badge">{expense.subcategory}</span>
                      )}
                    </div>
                  </div>
                  <div className="expense-right">
                    <div className="expense-amount">₹{expense.amount}</div>
                    <button 
                      className="expense-delete" 
                      onClick={() => deleteExpense(expense._id)}
                    >
                      <IoTrashOutline />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!showAddExpense && (
        <button className="fab" onClick={() => setShowAddExpense(true)}>
          <IoAddOutline />
        </button>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">New Expense</h3>
            <form onSubmit={handleAddExpense}>
              <div className="input-group">
                <input
                  type="number"
                  inputMode="decimal"
                  className="input"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="input-group">
                <select
                  className="input"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills">Bills</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Subcategory (optional)"
                  value={newExpense.subcategory}
                  onChange={(e) => setNewExpense({ ...newExpense, subcategory: e.target.value })}
                />
              </div>
              <div className="input-group">
                <select
                  className="input"
                  value={newExpense.paymentMode}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMode: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <textarea
                  className="input"
                  placeholder="Description (optional)"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  rows="2"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddExpense(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;