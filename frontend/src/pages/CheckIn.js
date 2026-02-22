import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './CheckIn.css';

const CheckIn = () => {
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [formData, setFormData] = useState({
    mood: '',
    taskFeeling: '',
    note: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkTodayCheckIn();
  }, []);

  const checkTodayCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/checkins?date=${today}`);
      if (response.data.length > 0) {
        setTodayCheckIn(response.data[0]);
      }
    } catch (error) {
      console.error('Error checking today check-in:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mood || !formData.taskFeeling) return;

    try {
      await api.post('/checkins', {
        ...formData,
        date: new Date(),
      });
      navigate('/');
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in');
    }
  };

  if (todayCheckIn) {
    return (
      <div className="page checkin-page">
        <div className="page-header">
          <h1 className="page-title">Daily Check-in</h1>
          <p className="page-subtitle">Already done for today!</p>
        </div>

        <div className="checkin-completed">
          <div className="completed-icon">✓</div>
          <h3>You've checked in today</h3>
          <div className="completed-details">
            <div className="detail-row">
              <span>Mood:</span>
              <span className="detail-value">{todayCheckIn.mood}</span>
            </div>
            <div className="detail-row">
              <span>Tasks felt:</span>
              <span className="detail-value">{todayCheckIn.taskFeeling}</span>
            </div>
            {todayCheckIn.note && (
              <div className="detail-row">
                <span>Note:</span>
                <span className="detail-value">{todayCheckIn.note}</span>
              </div>
            )}
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkin-page">
      <div className="page-header">
        <h1 className="page-title">Daily Check-in</h1>
        <p className="page-subtitle">How was your day?</p>
      </div>

      <form onSubmit={handleSubmit} className="checkin-form">
        {/* Mood Selection */}
        <div className="checkin-question">
          <label className="question-label">How was your day?</label>
          <div className="mood-options">
            <button
              type="button"
              className={`mood-btn ${formData.mood === 'Low' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, mood: 'Low' })}
            >
              <span className="mood-emoji">😞</span>
              <span className="mood-label">Low</span>
            </button>
            <button
              type="button"
              className={`mood-btn ${formData.mood === 'Okay' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, mood: 'Okay' })}
            >
              <span className="mood-emoji">😐</span>
              <span className="mood-label">Okay</span>
            </button>
            <button
              type="button"
              className={`mood-btn ${formData.mood === 'Good' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, mood: 'Good' })}
            >
              <span className="mood-emoji">🙂</span>
              <span className="mood-label">Good</span>
            </button>
          </div>
        </div>

        {/* Task Feeling */}
        <div className="checkin-question">
          <label className="question-label">How did tasks feel?</label>
          <div className="feeling-options">
            <button
              type="button"
              className={`feeling-btn ${formData.taskFeeling === 'Hard' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, taskFeeling: 'Hard' })}
            >
              Hard
            </button>
            <button
              type="button"
              className={`feeling-btn ${formData.taskFeeling === 'Okay' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, taskFeeling: 'Okay' })}
            >
              Okay
            </button>
            <button
              type="button"
              className={`feeling-btn ${formData.taskFeeling === 'Smooth' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, taskFeeling: 'Smooth' })}
            >
              Smooth
            </button>
          </div>
        </div>

        {/* Optional Note */}
        <div className="checkin-question">
          <label className="question-label">Anything to note? (optional)</label>
          <textarea
            className="input"
            placeholder="One line about your day..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows="3"
            maxLength="200"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary submit-btn"
          disabled={!formData.mood || !formData.taskFeeling}
        >
          Save Check-in
        </button>
      </form>
    </div>
  );
};

export default CheckIn;