import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Auth.css';

const Login = ({ setAuth }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkPinExists();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkPinExists = async () => {
    try {
      const response = await api.get('/auth/check-pin');
      if (!response.data.pinExists) {
        navigate('/setup');
      }
    } catch (err) {
      console.error('Error checking PIN:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    try {
      const response = await api.post('/auth/login', { pin });
      localStorage.setItem('token', response.data.token);
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Life OS</h1>
          <p className="auth-subtitle">Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              className="input pin-input-large"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn">
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;