import React from 'react';
import { NavLink } from 'react-router-dom';
import { IoHomeOutline, IoCheckboxOutline, IoWalletOutline, IoDocumentTextOutline, IoPersonOutline } from 'react-icons/io5';
import './BottomNav.css';

const BottomNav = () => {
  const navItems = [
    { path: '/', icon: IoHomeOutline, label: 'Home' },
    { path: '/tasks', icon: IoCheckboxOutline, label: 'Tasks' },
    { path: '/expenses', icon: IoWalletOutline, label: 'Money' },
    { path: '/documents', icon: IoDocumentTextOutline, label: 'Docs' },
    { path: '/profile', icon: IoPersonOutline, label: 'You' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon className="nav-icon" />
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;