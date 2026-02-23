import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IoArrowBackOutline, IoDownloadOutline, IoCalendarOutline } from 'react-icons/io5';
import api from '../config/api';
import './Report.css';

const PERIODS = [
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

const CATEGORY_COLORS = {
  Food: '#b00eb9',
  Transport: '#f50092',
  Shopping: '#ff4f6b',
  Entertainment: '#ff8e4f',
  Bills: '#ffc64c',
  Health: '#4caf8f',
  Other: '#7a7a7a',
};

const CATEGORY_EMOJI = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Bills: '📄', Health: '💊', Other: '📦',
};

const getDateRange = (period) => {
  const today = new Date(); today.setHours(23,59,59,999);
  let start;
  if (period === '7') { start = new Date(); start.setDate(start.getDate()-6); }
  else if (period === '30') { start = new Date(); start.setDate(start.getDate()-29); }
  else { start = new Date(today.getFullYear(), today.getMonth(), 1); }
  start.setHours(0,0,0,0);
  return { start, end: today };
};

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

const Report = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const fetchReport = useCallback(async (start, end) => {
    try {
      setLoading(true);
      const res = await api.get(`/expenses/report?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      setReport(res.data);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if dates passed via query params from Expenses page
    const sp_start = searchParams.get('startDate');
    const sp_end = searchParams.get('endDate');
    if (sp_start && sp_end) {
      fetchReport(new Date(sp_start), new Date(sp_end));
    } else {
      const range = getDateRange('month');
      fetchReport(range.start, range.end);
    }
  }, [fetchReport, searchParams]);

  const handlePeriodChange = (val) => {
    setPeriod(val);
    setShowCustomPicker(val === 'custom');
    if (val !== 'custom') {
      const range = getDateRange(val);
      fetchReport(range.start, range.end);
    }
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;
    const s = new Date(customStart); s.setHours(0,0,0,0);
    const e = new Date(customEnd); e.setHours(23,59,59,999);
    fetchReport(s, e);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const categories = report ? Object.entries(report.byCategory).sort((a,b) => b[1].total - a[1].total) : [];
  const maxCatTotal = categories.length ? categories[0][1].total : 1;

  return (
    <div className="page report-page" id="report-printable">
      {/* Header */}
      <div className="report-header">
        <button className="back-btn no-print" onClick={() => navigate(-1)}>
          <IoArrowBackOutline />
        </button>
        <div className="report-header-text">
          <h1 className="page-title">Spend Report</h1>
          {report && (
            <p className="page-subtitle">
              {fmtDate(report.startDate)} → {fmtDate(report.endDate)}
            </p>
          )}
        </div>
        <button className="download-btn no-print" onClick={handleDownloadPDF} title="Download PDF">
          <IoDownloadOutline />
        </button>
      </div>

      {/* Period Picker */}
      <div className="report-period-bar no-print">
        <div className="period-select-wrap">
          <IoCalendarOutline className="period-icon" />
          <select className="period-select" value={period} onChange={e => handlePeriodChange(e.target.value)}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {showCustomPicker && (
          <div className="custom-date-row" style={{marginTop: 8}}>
            <input type="date" className="date-input" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span className="date-sep">→</span>
            <input type="date" className="date-input" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            <button className="apply-btn" onClick={handleCustomApply}>Go</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="report-loading">Generating report...</div>
      ) : !report || report.count === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3 className="empty-state-title">No data</h3>
          <p className="empty-state-text">No expenses found for this period</p>
        </div>
      ) : (
        <>
          {/* Total Card */}
          <div className="report-total-card">
            <div className="report-total-label">Total Spent</div>
            <div className="report-total-amount">{fmt(report.total)}</div>
            <div className="report-total-meta">{report.count} transactions</div>
          </div>

          {/* Insight */}
          {report.topCategory && (
            <div className="report-insight">
              <span className="insight-emoji">{CATEGORY_EMOJI[report.topCategory] || '📦'}</span>
              <span className="insight-text">
                Most spent on <strong>{report.topCategory}</strong> — {fmt(report.topCategoryAmount)}{' '}
                <span className="insight-pct">({Math.round((report.topCategoryAmount / report.total) * 100)}%)</span>
              </span>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="report-section">
            <div className="report-section-title">Category Breakdown</div>
            <div className="report-categories">
              {categories.map(([cat, data]) => {
                const pct = Math.round((data.total / report.total) * 100);
                const barPct = Math.round((data.total / maxCatTotal) * 100);
                const color = CATEGORY_COLORS[cat] || '#7a7a7a';
                return (
                  <div key={cat} className="report-cat-item">
                    <div className="report-cat-header">
                      <div className="report-cat-left">
                        <span className="report-cat-emoji">{CATEGORY_EMOJI[cat] || '📦'}</span>
                        <div>
                          <div className="report-cat-name">{cat}</div>
                          <div className="report-cat-count">{data.count} transaction{data.count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="report-cat-right">
                        <div className="report-cat-amount">{fmt(data.total)}</div>
                        <div className="report-cat-pct">{pct}%</div>
                      </div>
                    </div>
                    <div className="report-bar-track">
                      <div className="report-bar-fill" style={{ width: `${barPct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 5 Transactions */}
          <div className="report-section">
            <div className="report-section-title">Top Transactions</div>
            <div className="report-top-list">
              {report.top5.map((exp, i) => (
                <div key={exp._id} className="report-top-item">
                  <div className="report-top-rank">#{i+1}</div>
                  <div className="report-top-details">
                    <div className="report-top-cat">{exp.category}</div>
                    {exp.description && <div className="report-top-desc">{exp.description}</div>}
                    <div className="report-top-date">{fmtDate(exp.date)}</div>
                  </div>
                  <div className="report-top-amount">{fmt(exp.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Spend */}
          <div className="report-section">
            <div className="report-section-title">Daily Spend</div>
            <div className="report-daily-list">
              {Object.entries(report.dailySpend)
                .sort((a,b) => new Date(b[0]) - new Date(a[0]))
                .map(([day, amount]) => (
                  <div key={day} className="report-daily-item">
                    <div className="report-daily-date">{fmtDate(day)}</div>
                    <div className="report-daily-bar-wrap">
                      <div className="report-daily-bar" style={{
                        width: `${Math.round((amount / report.total) * 100)}%`
                      }} />
                    </div>
                    <div className="report-daily-amount">{fmt(amount)}</div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Print Footer */}
          <div className="report-print-footer print-only">
            <p>Generated by Life OS · {new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</p>
          </div>
        </>
      )}

      {/* Download Button */}
      {!loading && report && report.count > 0 && (
        <div className="report-download-wrap no-print">
          <button className="report-download-btn" onClick={handleDownloadPDF}>
            <IoDownloadOutline />
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default Report;