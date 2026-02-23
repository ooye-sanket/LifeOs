import React, { useState, useEffect } from 'react';
import { IoWalletOutline, IoPieChartOutline, IoAlertCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import api from '../config/api';
import Expenses from './Expenses';
import './Budget.css';

const CATEGORY_ICONS = {
  rent: '🏠',
  phoneBills: '📱',
  emergency: '🚨',
  travel: '✈️',
  miscellaneous: '🛒',
};
const CATEGORY_LABELS = {
  rent: 'Rent',
  phoneBills: 'Phone Bills',
  emergency: 'Emergency',
  travel: 'Travel',
  miscellaneous: 'Miscellaneous',
};

const Budget = () => {
  const [activeTab, setActiveTab] = useState('money');
  const [budget, setBudgetData] = useState(null);
  const [alertData, setAlertData] = useState(null);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertItem, setAlertItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    totalAmount: '',
    days: '30',
    rent: '',
    phoneBills: '',
    emergency: '',
    travel: '',
  });

  const miscellaneous = (() => {
    const total = parseFloat(form.totalAmount) || 0;
    const fixed = (parseFloat(form.rent) || 0) + (parseFloat(form.phoneBills) || 0) +
      (parseFloat(form.emergency) || 0) + (parseFloat(form.travel) || 0);
    return Math.max(0, total - fixed);
  })();

  const loadBudget = async () => {
    try {
      setLoading(true);
      const [budgetRes, alertRes] = await Promise.all([
        api.get('/budget'),
        api.get('/budget/alert'),
      ]);
      setBudgetData(budgetRes.data);
      setAlertData(alertRes.data);

      if (budgetRes.data) {
        setForm({
          totalAmount: String(budgetRes.data.totalAmount),
          days: String(budgetRes.data.days),
          rent: String(budgetRes.data.rent || ''),
          phoneBills: String(budgetRes.data.phoneBills || ''),
          emergency: String(budgetRes.data.emergency || ''),
          travel: String(budgetRes.data.travel || ''),
        });
      }

      // Show alert if any category exceeded
      if (alertRes.data?.hasAlert) {
        const exceeded = alertRes.data.alerts.find(a => a.exceeded);
        if (exceeded) {
          setAlertItem(exceeded);
          setShowAlert(true);
        }
      }
    } catch (err) {
      console.error('Load budget error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) return;
    try {
      setSaving(true);
      await api.post('/budget', {
        totalAmount: parseFloat(form.totalAmount),
        days: parseInt(form.days) || 30,
        rent: parseFloat(form.rent) || 0,
        phoneBills: parseFloat(form.phoneBills) || 0,
        emergency: parseFloat(form.emergency) || 0,
        travel: parseFloat(form.travel) || 0,
      });
      await loadBudget();
      setShowSetBudget(false);
    } catch (err) {
      console.error('Save budget error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getPercent = (spent, limit) => {
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((spent / limit) * 100));
  };

  const getBarColor = (pct) => {
    if (pct >= 100) return 'bar--exceeded';
    if (pct >= 80) return 'bar--warning';
    return 'bar--ok';
  };

  return (
    <div className="page budget-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Money</h1>
        <p className="page-subtitle">Track spending & budgets</p>
      </div>

      {/* Sub Tabs */}
      <div className="budget-tabs">
        <button
          className={`budget-tab ${activeTab === 'money' ? 'active' : ''}`}
          onClick={() => setActiveTab('money')}
        >
          <IoWalletOutline /> Money
        </button>
        <button
          className={`budget-tab ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <IoPieChartOutline /> Budget
        </button>
      </div>

      {/* ── MONEY TAB ── */}
      {activeTab === 'money' && <Expenses />}

      {/* ── BUDGET TAB ── */}
      {activeTab === 'budget' && (
        <div className="budget-content">
          {loading ? (
            <div className="budget-loading">Loading...</div>
          ) : !budget ? (
            /* No budget set yet */
            <div className="no-budget-state">
              <div className="no-budget-icon">💰</div>
              <h3>No budget set</h3>
              <p>Set a monthly budget to track your spending limits</p>
              <button className="btn btn-primary budget-set-btn" onClick={() => setShowSetBudget(true)}>
                Set Monthly Budget
              </button>
            </div>
          ) : (
            <>
              {/* Budget Overview Card */}
              <div className="budget-overview-card">
                <div className="budget-overview-top">
                  <div>
                    <div className="budget-overview-label">Total Budget</div>
                    <div className="budget-overview-amount">₹{budget.totalAmount.toLocaleString('en-IN')}</div>
                    <div className="budget-overview-meta">{budget.days} day plan</div>
                  </div>
                  <div className="budget-overview-spent">
                    <div className="budget-overview-label">Spent</div>
                    <div className="budget-spent-amount">
                      ₹{(alertData?.budget?.spent ? Object.values(alertData.budget.spent).reduce((a,b)=>a+b,0) : 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <button className="budget-edit-btn" onClick={() => setShowSetBudget(true)}>
                  Edit Budget
                </button>
              </div>

              {/* Category Progress */}
              <div className="budget-categories">
                {['rent','phoneBills','emergency','travel','miscellaneous'].map(key => {
                  const limit = budget[key] || 0;
                  const spent = alertData?.budget?.spent?.[key] || 0;
                  const pct = getPercent(spent, limit);
                  const barClass = getBarColor(pct);
                  return (
                    <div key={key} className="budget-category-item">
                      <div className="budget-cat-header">
                        <div className="budget-cat-left">
                          <span className="budget-cat-icon">{CATEGORY_ICONS[key]}</span>
                          <span className="budget-cat-name">{CATEGORY_LABELS[key]}</span>
                        </div>
                        <div className="budget-cat-right">
                          <span className="budget-cat-spent">₹{spent.toLocaleString('en-IN')}</span>
                          <span className="budget-cat-limit"> / ₹{limit.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-bar ${barClass}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="budget-cat-pct">{pct}% used</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Set Budget Modal ── */}
      {showSetBudget && (
        <div className="modal-overlay" onClick={() => setShowSetBudget(false)}>
          <div className="modal-content budget-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Set Monthly Budget</h3>
            <form onSubmit={handleSaveBudget}>
              <div className="input-group">
                <label className="input-label">Total Amount (₹)</label>
                <input type="number" inputMode="decimal" className="input" placeholder="e.g. 30000"
                  value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Duration</label>
                <select className="input" value={form.days} onChange={e => setForm({...form, days: e.target.value})}>
                  <option value="7">7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days (Default)</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              <div className="budget-fixed-section">
                <div className="budget-fixed-title">Fixed Expenses</div>
                {[
                  { key: 'rent', label: '🏠 Rent', placeholder: 'e.g. 10000' },
                  { key: 'phoneBills', label: '📱 Phone Bills', placeholder: 'e.g. 500' },
                  { key: 'emergency', label: '🚨 Emergency Fund', placeholder: 'e.g. 2000' },
                  { key: 'travel', label: '✈️ Travel', placeholder: 'e.g. 3000' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="input-group">
                    <label className="input-label">{label}</label>
                    <input type="number" inputMode="decimal" className="input" placeholder={placeholder}
                      value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} />
                  </div>
                ))}
              </div>

              <div className="misc-preview">
                <span className="misc-label">🛒 Miscellaneous (auto)</span>
                <span className={`misc-amount ${miscellaneous < 0 ? 'misc-negative' : ''}`}>
                  ₹{miscellaneous.toLocaleString('en-IN')}
                </span>
              </div>
              {miscellaneous < 0 && (
                <div className="budget-error">Fixed expenses exceed total! Reduce fixed amounts.</div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSetBudget(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || miscellaneous < 0}>
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Budget Alert Popup ── */}
      {showAlert && alertItem && (
        <div className="modal-overlay">
          <div className="modal-content alert-modal">
            <div className="alert-icon">
              {alertItem.exceeded ? <IoAlertCircleOutline /> : <IoCheckmarkCircleOutline />}
            </div>
            <h3 className="alert-title">
              {alertItem.exceeded ? '⚠️ Budget Exceeded!' : '🔔 Almost There!'}
            </h3>
            <p className="alert-body">
              Your <strong>{CATEGORY_LABELS[alertItem.category]}</strong> budget is at <strong>{alertItem.percent}%</strong>.
              {alertItem.exceeded ? ' You have exceeded your limit.' : ' You are nearing your limit.'}
            </p>
            <p className="alert-sub">Do you have a backup plan?</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAlert(false)}>No, Go Back</button>
              <button className="btn btn-primary" onClick={() => { setShowAlert(false); setShowSetBudget(true); }}>
                Yes, Edit Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;