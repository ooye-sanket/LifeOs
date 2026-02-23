import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoAlertCircleOutline, IoCloseOutline, IoTrashOutline, IoCheckmarkOutline, IoPencilOutline } from 'react-icons/io5';
import api from '../config/api';
import toast from 'react-hot-toast';
import './Alerts.css';

const EMPTY_FORM = { title: '', description: '', alertDate: '', priority: 'Medium' };

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingAlert, setEditingAlert] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data);
    } catch { toast.error('Failed to load alerts'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/alerts', formData);
      toast.success('Alert created!');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      loadAlerts();
    } catch { toast.error('Failed to create alert'); }
  };

  const openEdit = (alert) => {
    setEditingAlert(alert);
    // Format alertDate for datetime-local input
    const d = new Date(alert.alertDate);
    const localStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    setEditForm({ title: alert.title, description: alert.description || '', alertDate: localStr, priority: alert.priority });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/alerts/${editingAlert._id}`, editForm);
      toast.success('Alert updated!');
      setEditingAlert(null);
      loadAlerts();
    } catch { toast.error('Failed to update alert'); }
  };

  const markAsRead = async (id) => {
    try { await api.put(`/alerts/${id}/read`); toast.success('Marked as read'); loadAlerts(); }
    catch { toast.error('Failed to mark as read'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try { await api.delete(`/alerts/${id}`); toast.success('Alert deleted'); loadAlerts(); }
    catch { toast.error('Failed to delete alert'); }
  };

  const getTimeUntil = (date) => {
    const diff = new Date(date) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const AlertForm = ({ value, onChange, onSubmit, onCancel, title, submitLabel }) => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onCancel}><IoCloseOutline /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input type="text" className="input" value={value.title}
              onChange={e => onChange({...value, title: e.target.value})} required placeholder="e.g., Doctor's Appointment" autoFocus />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" value={value.description}
              onChange={e => onChange({...value, description: e.target.value})} rows="3" placeholder="Add details..." />
          </div>
          <div className="input-group">
            <label className="input-label">Alert Date *</label>
            <input type="datetime-local" className="input" value={value.alertDate}
              onChange={e => onChange({...value, alertDate: e.target.value})} required />
          </div>
          <div className="input-group">
            <label className="input-label">Priority</label>
            <select className="input" value={value.priority} onChange={e => onChange({...value, priority: e.target.value})}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{submitLabel}</button>
        </form>
      </div>
    </div>
  );

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const readAlerts = alerts.filter(a => a.isRead);

  return (
    <div className="page alerts-page">
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
        <p className="page-subtitle">{unreadAlerts.length} unread alerts</p>
      </div>

      {unreadAlerts.length > 0 && (
        <div className="section">
          <h2 className="section-title">Unread</h2>
          <div className="alerts-list">
            {unreadAlerts.map(alert => (
              <div key={alert._id} className={`alert-card priority-${alert.priority.toLowerCase()}`}>
                <div className="alert-card-header">
                  <IoAlertCircleOutline className="alert-card-icon" />
                  <span className={`priority-badge priority-${alert.priority.toLowerCase()}`}>{alert.priority}</span>
                  <div className="alert-actions">
                    <button className="action-btn edit-btn" onClick={() => openEdit(alert)} title="Edit"><IoPencilOutline /></button>
                    <button className="action-btn read-btn" onClick={() => markAsRead(alert._id)} title="Mark as read"><IoCheckmarkOutline /></button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(alert._id)} title="Delete"><IoTrashOutline /></button>
                  </div>
                </div>
                <h3 className="alert-title">{alert.title}</h3>
                {alert.description && <p className="alert-description">{alert.description}</p>}
                <div className="alert-footer">
                  <span className="alert-date">{new Date(alert.alertDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
                  <span className={`alert-time ${getTimeUntil(alert.alertDate)==='Overdue'?'overdue':''}`}>{getTimeUntil(alert.alertDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {readAlerts.length > 0 && (
        <div className="section">
          <h2 className="section-title">Read</h2>
          <div className="alerts-list">
            {readAlerts.map(alert => (
              <div key={alert._id} className="alert-card alert-card-read">
                <div className="alert-card-header">
                  <IoAlertCircleOutline className="alert-card-icon" />
                  <span className={`priority-badge priority-${alert.priority.toLowerCase()}`}>{alert.priority}</span>
                  <div className="alert-actions">
                    <button className="action-btn edit-btn" onClick={() => openEdit(alert)} title="Edit"><IoPencilOutline /></button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(alert._id)} title="Delete"><IoTrashOutline /></button>
                  </div>
                </div>
                <h3 className="alert-title">{alert.title}</h3>
                {alert.description && <p className="alert-description">{alert.description}</p>}
                <div className="alert-footer">
                  <span className="alert-date">{new Date(alert.alertDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="empty-state">
          <IoAlertCircleOutline className="empty-state-icon" />
          <h3 className="empty-state-title">No alerts</h3>
          <p className="empty-state-text">Create your first alert to get notified</p>
        </div>
      )}

      <button className="fab" onClick={() => setShowModal(true)}><IoAddOutline /></button>

      {showModal && (
        <AlertForm value={formData} onChange={setFormData} onSubmit={handleSubmit}
          onCancel={() => { setShowModal(false); setFormData(EMPTY_FORM); }}
          title="Create New Alert" submitLabel="Create Alert" />
      )}

      {editingAlert && (
        <AlertForm value={editForm} onChange={setEditForm} onSubmit={handleEditSave}
          onCancel={() => setEditingAlert(null)}
          title="Edit Alert" submitLabel="Save Changes" />
      )}
    </div>
  );
};

export default Alerts;