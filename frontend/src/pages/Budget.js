import React, { useState, useEffect, useCallback } from 'react';
import { IoWalletOutline, IoPieChartOutline, IoAlertCircleOutline } from 'react-icons/io5';
import api from '../config/api';
import Expenses from './Expenses';
import './Budget.css';

const CATEGORY_ICONS = { rent:'🏠', phoneBills:'📱', emergency:'🚨', travel:'✈️', miscellaneous:'🛒' };
const CATEGORY_LABELS = { rent:'Rent', phoneBills:'Phone Bills', emergency:'Emergency', travel:'Travel', miscellaneous:'Miscellaneous' };
const CATEGORY_KEYS = ['rent','phoneBills','emergency','travel','miscellaneous'];

const Budget = () => {
  const [activeTab, setActiveTab] = useState('money');
  const [budget, setBudgetData] = useState(null);
  const [spentData, setSpentData] = useState({});
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertItem, setAlertItem] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    totalAmount: '', days: '30', rent: '', phoneBills: '', emergency: '', travel: '',
  });

  const miscellaneous = (() => {
    const total = parseFloat(form.totalAmount) || 0;
    const fixed = (parseFloat(form.rent)||0) + (parseFloat(form.phoneBills)||0) +
                  (parseFloat(form.emergency)||0) + (parseFloat(form.travel)||0);
    return total - fixed;
  })();

  const loadBudget = useCallback(async () => {
    try {
      setPageLoading(true);
      const [budgetRes, alertRes] = await Promise.all([
        api.get('/budget'),
        api.get('/budget/alert'),
      ]);

      const b = budgetRes.data;
      setBudgetData(b);

      if (b) {
        setForm({
          totalAmount: String(b.totalAmount),
          days: String(b.days),
          rent: String(b.rent || ''),
          phoneBills: String(b.phoneBills || ''),
          emergency: String(b.emergency || ''),
          travel: String(b.travel || ''),
        });
      }

      if (alertRes.data?.budget?.spent) {
        setSpentData(alertRes.data.budget.spent);
      }

      // Only show alert popup once per session, not every load
      if (alertRes.data?.hasAlert && !showAlert) {
        const exceeded = alertRes.data.alerts.find(a => a.exceeded);
        if (exceeded) { setAlertItem(exceeded); setShowAlert(true); }
      }
    } catch (err) {
      console.error('Load budget error:', err);
    } finally {
      setPageLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadBudget(); }, [loadBudget]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    // Hard guard — never allow double submit
    if (saving) return;
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) return;
    if (miscellaneous < 0) return;

    setSaving(true);
    setSaveError('');

    try {
      const res = await api.post('/budget', {
        totalAmount: parseFloat(form.totalAmount),
        days: parseInt(form.days) || 30,
        rent: parseFloat(form.rent) || 0,
        phoneBills: parseFloat(form.phoneBills) || 0,
        emergency: parseFloat(form.emergency) || 0,
        travel: parseFloat(form.travel) || 0,
      });

      // Update state directly from response — no loadBudget() call here
      // This avoids the race condition with setLoading
      const saved = res.data;
      setBudgetData(saved);
      setSpentData({});  // Reset spent — will refresh on next full load

      // Close modal first, THEN switch to budget tab so user sees results
      setShowSetBudget(false);
      setActiveTab('budget');

      // Now do a background reload for accurate spend data
      api.get('/budget/alert').then(alertRes => {
        if (alertRes.data?.budget?.spent) setSpentData(alertRes.data.budget.spent);
      }).catch(() => {});

    } catch (err) {
      console.error('Save budget error:', err);
      setSaveError(err?.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openSetBudget = () => { setSaveError(''); setShowSetBudget(true); };
  const closeSetBudget = () => { if (saving) return; setShowSetBudget(false); setSaveError(''); };

  const getPercent = (spent, limit) => {
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((spent / limit) * 100));
  };
  const getBarClass = (pct) => pct >= 100 ? 'bar--exceeded' : pct >= 80 ? 'bar--warning' : 'bar--ok';

  const totalSpent = Object.values(spentData).reduce((a,b) => a+b, 0);

  return (
    <div className="page budget-page">
      <div className="page-header">
        <h1 className="page-title">Money</h1>
        <p className="page-subtitle">Track spending & budgets</p>
      </div>

      {/* Sub Tabs */}
      <div className="budget-tabs">
        <button className={`budget-tab ${activeTab==='money'?'active':''}`} onClick={() => setActiveTab('money')}>
          <IoWalletOutline /> Money
        </button>
        <button className={`budget-tab ${activeTab==='budget'?'active':''}`} onClick={() => setActiveTab('budget')}>
          <IoPieChartOutline /> Budget
        </button>
      </div>

      {/* MONEY TAB */}
      {activeTab === 'money' && <Expenses />}

      {/* BUDGET TAB */}
      {activeTab === 'budget' && (
        <div className="budget-content">
          {pageLoading ? (
            <div className="budget-loading">
              <div className="budget-spinner" />
              <p>Loading budget...</p>
            </div>
          ) : !budget ? (
            <div className="no-budget-state">
              <div className="no-budget-icon">💰</div>
              <h3>No budget set</h3>
              <p>Set a monthly budget to track your spending limits</p>
              <button className="btn btn-primary budget-set-btn" onClick={openSetBudget}>
                Set Monthly Budget
              </button>
            </div>
          ) : (
            <>
              {/* Overview */}
              <div className="budget-overview-card">
                <div className="budget-overview-top">
                  <div>
                    <div className="budget-overview-label">Total Budget</div>
                    <div className="budget-overview-amount">₹{budget.totalAmount.toLocaleString('en-IN')}</div>
                    <div className="budget-overview-meta">{budget.days} day plan</div>
                  </div>
                  <div className="budget-overview-spent">
                    <div className="budget-overview-label">Spent So Far</div>
                    <div className="budget-spent-amount">₹{totalSpent.toLocaleString('en-IN')}</div>
                    <div className="budget-overview-meta">
                      ₹{(budget.totalAmount - totalSpent).toLocaleString('en-IN')} left
                    </div>
                  </div>
                </div>
                <button className="budget-edit-btn" onClick={openSetBudget}>Edit Budget</button>
              </div>

              {/* Category Progress */}
              <div className="budget-categories">
                {CATEGORY_KEYS.map(key => {
                  const limit = budget[key] || 0;
                  const spent = spentData[key] || 0;
                  const pct = getPercent(spent, limit);
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
                        <div className={`progress-bar ${getBarClass(pct)}`} style={{width:`${pct}%`}} />
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

      {/* Set Budget Modal */}
      {showSetBudget && (
        <div className="modal-overlay" onClick={closeSetBudget}>
          <div className="modal-content budget-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{budget ? 'Edit Budget' : 'Set Monthly Budget'}</h3>
            <form onSubmit={handleSaveBudget}>
              <div className="input-group">
                <label className="input-label">Total Amount (₹)</label>
                <input type="number" inputMode="decimal" className="input" placeholder="e.g. 30000"
                  value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})}
                  disabled={saving} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Duration</label>
                <select className="input" value={form.days}
                  onChange={e => setForm({...form, days: e.target.value})} disabled={saving}>
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
                  {key:'rent', label:'🏠 Rent', placeholder:'e.g. 10000'},
                  {key:'phoneBills', label:'📱 Phone Bills', placeholder:'e.g. 500'},
                  {key:'emergency', label:'🚨 Emergency Fund', placeholder:'e.g. 2000'},
                  {key:'travel', label:'✈️ Travel', placeholder:'e.g. 3000'},
                ].map(({key, label, placeholder}) => (
                  <div key={key} className="input-group">
                    <label className="input-label">{label}</label>
                    <input type="number" inputMode="decimal" className="input" placeholder={placeholder}
                      value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                      disabled={saving} />
                  </div>
                ))}
              </div>

              <div className={`misc-preview ${miscellaneous < 0 ? 'misc-preview--error' : ''}`}>
                <span className="misc-label">🛒 Miscellaneous (auto-calculated)</span>
                <span className={`misc-amount ${miscellaneous < 0 ? 'misc-negative' : ''}`}>
                  ₹{Math.max(0, miscellaneous).toLocaleString('en-IN')}
                </span>
              </div>

              {miscellaneous < 0 && (
                <div className="budget-error">Fixed expenses exceed total! Reduce them.</div>
              )}
              {saveError && (
                <div className="budget-error">{saveError}</div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeSetBudget} disabled={saving}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${saving ? 'btn-saving' : ''}`}
                  disabled={saving || miscellaneous < 0 || !form.totalAmount}
                >
                  {saving ? (
                    <><span className="btn-spinner" /> Saving...</>
                  ) : (
                    budget ? 'Update Budget' : 'Save Budget'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Popup */}
      {showAlert && alertItem && (
        <div className="modal-overlay">
          <div className="modal-content alert-modal">
            <div className="alert-icon"><IoAlertCircleOutline /></div>
            <h3 className="alert-title">⚠️ Budget Alert!</h3>
            <p className="alert-body">
              Your <strong>{CATEGORY_LABELS[alertItem.category]}</strong> is at <strong>{alertItem.percent}%</strong>.
              {alertItem.exceeded ? ' You have exceeded your limit.' : ' You are nearing your limit.'}
            </p>
            <p className="alert-sub">Do you have a backup plan?</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAlert(false)}>No, Go Back</button>
              <button className="btn btn-primary" onClick={() => { setShowAlert(false); openSetBudget(); }}>
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