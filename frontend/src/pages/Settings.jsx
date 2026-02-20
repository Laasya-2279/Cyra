import React, { useState } from 'react';
import { useCycle } from '../context/CycleContext';
import './Settings.css';

const Settings = () => {
  const { settings, updateSettings, isConnected } = useCycle();
  
  const [formData, setFormData] = useState({
    cycleLength: settings.cycleLength || 28,
    periodLength: settings.periodLength || 5,
    notifications: settings.notifications || true,
    deviceId: settings.deviceId || '',
    serverUrl: settings.serverUrl || 'http://localhost:5000'
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
    alert('Settings saved!');
  };
  
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <form onSubmit={handleSubmit}>
        <section className="settings-section">
          <h2>Cycle Settings</h2>
          
          <div className="form-group">
            <label htmlFor="cycleLength">Average Cycle Length (days)</label>
            <input
              type="number"
              id="cycleLength"
              name="cycleLength"
              value={formData.cycleLength}
              onChange={handleChange}
              min={21}
              max={40}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="periodLength">Period Length (days)</label>
            <input
              type="number"
              id="periodLength"
              name="periodLength"
              value={formData.periodLength}
              onChange={handleChange}
              min={2}
              max={10}
            />
          </div>
        </section>
        
        <section className="settings-section">
          <h2>Device Connection</h2>
          
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Device Connected' : 'Device Disconnected'}</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="deviceId">Device ID</label>
            <input
              type="text"
              id="deviceId"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              placeholder="e.g., cycleaura_001"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="serverUrl">Server URL</label>
            <input
              type="text"
              id="serverUrl"
              name="serverUrl"
              value={formData.serverUrl}
              onChange={handleChange}
              placeholder="http://localhost:5000"
            />
          </div>
        </section>
        
        <section className="settings-section">
          <h2>Notifications</h2>
          
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="notifications"
              name="notifications"
              checked={formData.notifications}
              onChange={handleChange}
            />
            <label htmlFor="notifications">Enable push notifications</label>
          </div>
        </section>
        
        <section className="settings-section">
          <h2>Data Management</h2>
          
          <div className="button-group">
            <button type="button" className="btn secondary">
              Export Data
            </button>
            <button type="button" className="btn secondary">
              Import Data
            </button>
            <button type="button" className="btn danger">
              Clear All Data
            </button>
          </div>
        </section>
        
        <button type="submit" className="btn primary save-btn">
          Save Settings
        </button>
      </form>
      
      <footer className="settings-footer">
        <p>CycleAura v1.0.0</p>
        <p>Smart Menstrual Cycle Tracking</p>
      </footer>
    </div>
  );
};

export default Settings;
