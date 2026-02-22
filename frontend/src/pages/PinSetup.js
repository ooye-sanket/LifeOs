import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Auth.css';

const PinSetup = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      const response = await api.post('/auth/create-pin', { pin });
      localStorage.setItem('token', response.data.token);
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create PIN');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Welcome to Life OS</h1>
          <p className="auth-subtitle">Create your 4-digit PIN to secure your data</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Create PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              className="input pin-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              className="input pin-input"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn">
            Create PIN & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default PinSetup;