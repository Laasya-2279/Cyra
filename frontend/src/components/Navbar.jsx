import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/insights', label: 'Insights', icon: '📊' },
    { path: '/journal', label: 'Journal', icon: '📝' },
    { path: '/tips', label: 'Tips', icon: '💡' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
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
      
      <div className="navbar-actions">
        <button className="sync-btn" title="Sync Data">
          🔄
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
