import React, { useState } from 'react';
import { useCycle } from '../context/CycleContext';
import './Settings.css';

const Settings = () => {
  const { settings, updateSettings, isConnected } = useCycle();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Device & Notifications
    cycleLength: settings.cycleLength || 28,
    periodLength: settings.periodLength || 5,
    notifications: settings.notifications || true,
    deviceId: settings.deviceId || '',
    serverUrl: settings.serverUrl || 'http://localhost:5000',

    // Step 2 — Body & Cycle Basics
    dob: settings.dob || '',
    height: settings.height || '',
    heightUnit: settings.heightUnit || 'cm',
    weight: settings.weight || '',
    weightUnit: settings.weightUnit || 'kg',
    lastPeriod: settings.lastPeriod || '',
    periodRegularity: settings.periodRegularity || '',

    // Step 3 — Cycle Health History
    previousCycles: settings.previousCycles || [{ startDate: '', endDate: '', notes: '' }],
    birthControlType: settings.birthControlType || '',
    healthConditions: settings.healthConditions || [],
    otherCondition: settings.otherCondition || '',

    // Step 4 — Lifestyle & Wellness
    baseMood: settings.baseMood || '',
    sleepHours: settings.sleepHours || '7',
    sleepChangeDuringPeriod: settings.sleepChangeDuringPeriod || '',
    skinCondition: settings.skinCondition || '',
    skinChangeDuringPeriod: settings.skinChangeDuringPeriod || '',
    energyLevel: settings.energyLevel || '5',
    diet: settings.diet || '',
    mentalHealth: settings.mentalHealth || '',
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const toggleCondition = (c) => {
    setFormData(f => ({
      ...f,
      healthConditions: f.healthConditions.includes(c)
        ? f.healthConditions.filter(x => x !== c)
        : [...f.healthConditions, c],
    }));
  };

  const updateCycle = (i, field, val) => {
    const cycles = [...formData.previousCycles];
    cycles[i] = { ...cycles[i], [field]: val };
    setFormData({ ...formData, previousCycles: cycles });
  };

  const addCycle = () => {
    setFormData(f => ({
      ...f,
      previousCycles: [...f.previousCycles, { startDate: '', endDate: '', notes: '' }]
    }));
  };

  const removeCycle = (i) => {
    setFormData(f => ({
      ...f,
      previousCycles: f.previousCycles.filter((_, idx) => idx !== i)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    updateSettings(formData);
    setLoading(false);
    alert('Settings saved!');
  };
  
  return (
    <div className="settings-page">
      <h1>Settings & Profile</h1>
      
      <form onSubmit={handleSubmit}>
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Device & Notifications Section */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="settings-section">
          <h2>🔌 Device Connection</h2>
          
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
          <h2>🔔 Notifications</h2>
          
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

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Body & Cycle Basics */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="settings-section">
          <h2>📏 Personal Information</h2>
          
          <div className="form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="height">Height</label>
              <div className="input-unit-row">
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder={formData.heightUnit === 'cm' ? 'e.g. 162' : 'e.g. 64'}
                />
                <div className="unit-toggle">
                  <button
                    type="button"
                    className={`unit-btn ${formData.heightUnit === 'cm' ? 'unit-btn--active' : ''}`}
                    onClick={() => setFormData({ ...formData, heightUnit: 'cm' })}
                  >cm</button>
                  <button
                    type="button"
                    className={`unit-btn ${formData.heightUnit === 'in' ? 'unit-btn--active' : ''}`}
                    onClick={() => setFormData({ ...formData, heightUnit: 'in' })}
                  >in</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight</label>
              <div className="input-unit-row">
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder={formData.weightUnit === 'kg' ? 'e.g. 62' : 'e.g. 137'}
                />
                <div className="unit-toggle">
                  <button
                    type="button"
                    className={`unit-btn ${formData.weightUnit === 'kg' ? 'unit-btn--active' : ''}`}
                    onClick={() => setFormData({ ...formData, weightUnit: 'kg' })}
                  >kg</button>
                  <button
                    type="button"
                    className={`unit-btn ${formData.weightUnit === 'lbs' ? 'unit-btn--active' : ''}`}
                    onClick={() => setFormData({ ...formData, weightUnit: 'lbs' })}
                  >lbs</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>📅 Cycle Basics</h2>
          
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

          <div className="form-group">
            <label htmlFor="lastPeriod">Last Period Start Date</label>
            <input
              type="date"
              id="lastPeriod"
              name="lastPeriod"
              value={formData.lastPeriod}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="periodRegularity">Period Regularity</label>
            <select id="periodRegularity" name="periodRegularity" value={formData.periodRegularity} onChange={handleChange}>
              <option value="">Select regularity…</option>
              <option value="very-regular">Very Regular (28 ± 1 day)</option>
              <option value="regular">Regular (28 ± 2-3 days)</option>
              <option value="somewhat-irregular">Somewhat Irregular (varies 5+ days)</option>
              <option value="irregular">Irregular / PCOS / Tracking New</option>
            </select>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Cycle Health History */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="settings-section">
          <h2>📊 Cycle History</h2>
          
          {formData.previousCycles.map((cycle, i) => (
            <div key={i} className="cycle-log-card">
              <div className="cycle-log-header">
                <span className="cycle-log-num">Cycle {i + 1}</span>
                {formData.previousCycles.length > 1 && (
                  <button className="cycle-remove-btn" type="button" onClick={() => removeCycle(i)}>✕</button>
                )}
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={cycle.startDate}
                    onChange={e => updateCycle(i, 'startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={cycle.endDate}
                    onChange={e => updateCycle(i, 'endDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. heavy flow, cramps, stress..."
                  value={cycle.notes}
                  onChange={e => updateCycle(i, 'notes', e.target.value)}
                />
              </div>
            </div>
          ))}

          {formData.previousCycles.length < 12 && (
            <button className="btn secondary" type="button" onClick={addCycle}>
              + Add Another Cycle
            </button>
          )}
        </section>

        <section className="settings-section">
          <h2>💊 Birth Control & Health</h2>
          
          <div className="form-group">
            <label htmlFor="birthControl">Birth Control Method</label>
            <select id="birthControl" name="birthControlType" value={formData.birthControlType} onChange={handleChange}>
              <option value="">Select or skip…</option>
              <option value="none">Not using birth control</option>
              <option value="hormonal-pill">Hormonal Pill</option>
              <option value="iud">IUD</option>
              <option value="implant">Implant</option>
              <option value="injection">Injection (Depo-Provera)</option>
              <option value="nfp">Natural Family Planning</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Health Conditions</label>
            <div className="checkbox-group">
              {['PCOS', 'Endometriosis', 'Irregular Cycles', 'Heavy Bleeding', 'Severe Cramps', 'Thyroid Disorder', 'Anemia'].map(c => (
                <label key={c} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.healthConditions.includes(c)}
                    onChange={() => toggleCondition(c)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Lifestyle & Wellness */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="settings-section">
          <h2>😊 Mood & Mental Health</h2>
          
          <div className="form-group">
            <label htmlFor="baseMood">Baseline Mood</label>
            <select id="baseMood" name="baseMood" value={formData.baseMood} onChange={handleChange}>
              <option value="">Select…</option>
              <option value="mostly-happy">Mostly Happy & Balanced</option>
              <option value="anxiety-prone">Anxiety-Prone</option>
              <option value="depression-history">History of Depression</option>
              <option value="mood-swings">Prone to Mood Swings</option>
              <option value="stress-reactive">Stress-Reactive</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mentalHealth">Mental Health Notes</label>
            <textarea
              id="mentalHealth"
              name="mentalHealth"
              rows="3"
              placeholder="Any diagnosed conditions or concerns?"
              value={formData.mentalHealth}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="settings-section">
          <h2>😴 Sleep</h2>
          
          <div className="form-group">
            <label htmlFor="sleepHours">Typical Sleep Hours: <strong>{formData.sleepHours}h</strong></label>
            <input
              type="range"
              id="sleepHours"
              name="sleepHours"
              min="4"
              max="12"
              step="0.5"
              value={formData.sleepHours}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sleepChange">Sleep Changes During Period?</label>
            <select id="sleepChange" name="sleepChangeDuringPeriod" value={formData.sleepChangeDuringPeriod} onChange={handleChange}>
              <option value="">Select…</option>
              <option value="better">Better Sleep</option>
              <option value="no-change">No Change</option>
              <option value="insomnia">Trouble Falling Asleep</option>
              <option value="waking">Waking During Night</option>
              <option value="oversleeping">Oversleeping</option>
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h2>✨ Skin</h2>
          
          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="skinCondition">Typical Skin Type</label>
              <select id="skinCondition" name="skinCondition" value={formData.skinCondition} onChange={handleChange}>
                <option value="">Select…</option>
                <option value="clear">Clear & Healthy</option>
                <option value="oily">Oily</option>
                <option value="dry">Dry</option>
                <option value="acne-prone">Acne-Prone</option>
                <option value="sensitive">Sensitive</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="skinChange">Skin Changes During Period?</label>
              <select id="skinChange" name="skinChangeDuringPeriod" value={formData.skinChangeDuringPeriod} onChange={handleChange}>
                <option value="">Select…</option>
                <option value="breakouts">Breakouts</option>
                <option value="no-change">No Change</option>
                <option value="flare-up">Flare-up</option>
                <option value="improved">Improved</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>⚡ Energy & Diet</h2>
          
          <div className="form-group">
            <label htmlFor="energyLevel">Baseline Energy Level: <strong>{formData.energyLevel}/10</strong></label>
            <input
              type="range"
              id="energyLevel"
              name="energyLevel"
              min="1"
              max="10"
              value={formData.energyLevel}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="diet">Diet / Nutrition</label>
            <textarea
              id="diet"
              name="diet"
              rows="3"
              placeholder="e.g. Vegetarian, food sensitivities, dietary goals"
              value={formData.diet}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* Data Management Section */}
        <section className="settings-section">
          <h2>📂 Data Management</h2>
          
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
        
        <button type="submit" className={`btn primary save-btn ${loading ? 'btn--loading' : ''}`} disabled={loading}>
          {loading ? 'Saving...' : 'Save All Settings'}
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
