import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAddOutline, IoTrashOutline, IoBarChartOutline, IoCalendarOutline } from 'react-icons/io5';
import api from '../config/api';
import './Expenses.css';

const PERIODS = [
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

const getDateRange = (period) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  let start;
  if (period === '7') {
    start = new Date();
    start.setDate(start.getDate() - 6);
  } else if (period === '30') {
    start = new Date();
    start.setDate(start.getDate() - 29);
  } else {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end: today };
};

const Expenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [newExpense, setNewExpense] = useState({
    amount: '', category: 'Food', subcategory: '', paymentMode: 'UPI', description: '',
  });

  const loadExpenses = useCallback(async () => {
    try {
      let start, end;
      if (period === 'custom' && customStart && customEnd) {
        start = new Date(customStart); start.setHours(0,0,0,0);
        end = new Date(customEnd); end.setHours(23,59,59,999);
      } else if (period !== 'custom') {
        const range = getDateRange(period);
        start = range.start; end = range.end;
      } else return;
      const response = await api.get(`/expenses?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      setExpenses(response.data);
      setMonthlyTotal(response.data.reduce((sum, exp) => sum + exp.amount, 0));
    } catch (error) { console.error('Error loading expenses:', error); }
  }, [period, customStart, customEnd]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handlePeriodChange = (val) => {
    setPeriod(val); setShowTodayOnly(false);
    setShowCustomPicker(val === 'custom');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) return;
    try {
      await api.post('/expenses', { ...newExpense, amount: parseFloat(newExpense.amount), date: new Date() });
      setNewExpense({ amount: '', category: 'Food', subcategory: '', paymentMode: 'UPI', description: '' });
      setShowAddExpense(false);
      loadExpenses();
    } catch (error) { console.error('Error adding expense:', error); }
  };

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${expenseId}`); loadExpenses(); }
    catch (error) { console.error('Error deleting expense:', error); }
  };

  const handleGetReport = () => {
    let startIso, endIso;
    if (period === 'custom' && customStart && customEnd) {
      startIso = new Date(customStart).toISOString();
      endIso = new Date(customEnd + 'T23:59:59').toISOString();
    } else {
      const range = getDateRange(period);
      startIso = range.start.toISOString(); endIso = range.end.toISOString();
    }
    navigate(`/report?startDate=${startIso}&endDate=${endIso}`);
  };

  const todayExpenses = expenses.filter(e => {
    const d = new Date(e.date); const today = new Date();
    return d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear();
  });
  const todayTotal = todayExpenses.reduce((s,e) => s + e.amount, 0);
  const displayedExpenses = showTodayOnly ? todayExpenses : expenses;

  const groupExpensesByDate = () => {
    const grouped = {};
    displayedExpenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(expense);
    });
    return grouped;
  };
  const groupedExpenses = groupExpensesByDate();
  const periodLabel = PERIODS.find(p => p.value === period)?.label || 'This Month';

  return (
    <div className="expenses-page">
      {/* Period Filter */}
      <div className="period-filter-bar">
        <div className="period-select-wrap">
          <IoCalendarOutline className="period-icon" />
          <select className="period-select" value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {showCustomPicker && (
        <div className="custom-date-row">
          <input type="date" className="date-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          <span className="date-sep">→</span>
          <input type="date" className="date-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards-row">
        <div className="summary-card summary-card--main">
          <div className="summary-card-label">{periodLabel}</div>
          <div className="summary-card-amount">₹{monthlyTotal.toLocaleString('en-IN')}</div>
          <div className="summary-card-meta">{expenses.length} transactions</div>
        </div>
        <div className="summary-cards-side">
          <div className="summary-card summary-card--sm">
            <div className="summary-card-label">Today</div>
            <div className="summary-card-amount-sm">₹{todayTotal.toLocaleString('en-IN')}</div>
          </div>
          <div className={`summary-card summary-card--sm summary-card--toggle ${showTodayOnly ? 'active' : ''}`} onClick={() => setShowTodayOnly(t => !t)}>
            <div className="summary-card-label">Today Only</div>
            <div className="toggle-pill">{showTodayOnly ? 'ON' : 'OFF'}</div>
          </div>
        </div>
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
                    {expense.description && <div className="expense-description">{expense.description}</div>}
                    <div className="expense-meta">
                      <span className="payment-badge">{expense.paymentMode}</span>
                      {expense.subcategory && <span className="subcategory-badge">{expense.subcategory}</span>}
                    </div>
                  </div>
                  <div className="expense-right">
                    <div className="expense-amount">₹{expense.amount.toLocaleString('en-IN')}</div>
                    <button className="expense-delete" onClick={() => deleteExpense(expense._id)}><IoTrashOutline /></button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Get Report Button */}
      <div className="report-btn-wrap">
        <button className="report-btn" onClick={handleGetReport}>
          <IoBarChartOutline />
          Get Report
        </button>
      </div>

      {!showAddExpense && (
        <button className="fab" onClick={() => setShowAddExpense(true)}><IoAddOutline /></button>
      )}

      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">New Expense</h3>
            <form onSubmit={handleAddExpense}>
              <div className="input-group">
                <input type="number" inputMode="decimal" className="input" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} autoFocus />
              </div>
              <div className="input-group">
                <select className="input" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                  <option value="Food">Food</option><option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option><option value="Entertainment">Entertainment</option>
                  <option value="Bills">Bills</option><option value="Health">Health</option><option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <input type="text" className="input" placeholder="Subcategory (optional)" value={newExpense.subcategory} onChange={(e) => setNewExpense({ ...newExpense, subcategory: e.target.value })} />
              </div>
              <div className="input-group">
                <select className="input" value={newExpense.paymentMode} onChange={(e) => setNewExpense({ ...newExpense, paymentMode: e.target.value })}>
                  <option value="UPI">UPI</option><option value="Cash">Cash</option><option value="Card">Card</option><option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <textarea className="input" placeholder="Description (optional)" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} rows="2" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddExpense(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;