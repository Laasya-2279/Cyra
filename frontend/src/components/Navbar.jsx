import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/insights', label: 'Insights', icon: '📊' },
    { path: '/journal', label: 'Journal', icon: '📝' },
    { path: '/tips', label: 'Tips', icon: '💡' },
  ];
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🌸</span>
        <span className="brand-name">CycleAura</span>
      </div>
      
      <ul className="nav-links">
        {navItems.map(item => (
          <li key={item.path}>
            <NavLink 
              to={item.path}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <button className="sync-btn" title="Sync Data">
          🔄
      </button>
      <div className="navbar-actions">
        <NavLink 
          to="/profile"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          title="Profile"
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
