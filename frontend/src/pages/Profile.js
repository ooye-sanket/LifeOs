import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoLogOutOutline, IoLockClosedOutline, IoInformationCircleOutline } from 'react-icons/io5';
import './Profile.css';

const Profile = ({ setAuth }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      setAuth(false);
      navigate('/login');
    }
  };

  const version = '1.0.0';

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Settings & Info</p>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar">
          <span>LO</span>
        </div>
        <h2 className="profile-name">Life OS User</h2>
        <p className="profile-email">Your Personal Life CRM</p>
      </div>

      {/* Menu Items */}
      <div className="menu-section">
        <h3 className="section-title">Account</h3>
        <div className="menu-list">
          <button className="menu-item">
            <div className="menu-icon">
              <IoLockClosedOutline />
            </div>
            <div className="menu-content">
              <div className="menu-label">Change PIN</div>
              <div className="menu-sublabel">Update your security PIN</div>
            </div>
          </button>
        </div>
      </div>

      <div className="menu-section">
        <h3 className="section-title">About</h3>
        <div className="menu-list">
          <div className="menu-item info-item">
            <div className="menu-icon">
              <IoInformationCircleOutline />
            </div>
            <div className="menu-content">
              <div className="menu-label">Version</div>
              <div className="menu-sublabel">{version}</div>
            </div>
          </div>
          <div className="menu-item info-item">
            <div className="menu-content">
              <div className="menu-label">Philosophy</div>
              <div className="menu-sublabel">
                One app for everything personal. Calm, minimal, built for years.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button className="logout-btn" onClick={handleLogout}>
        <IoLogOutOutline />
        <span>Logout</span>
      </button>

      {/* Footer */}
      <div className="profile-footer">
        <p>Made with care for your personal life</p>
        <p className="footer-small">Life OS © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Profile;