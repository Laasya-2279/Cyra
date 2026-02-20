import React, { useState } from 'react';
import BBTGraph from '../components/BBTGraph';
import HeartRateGraph from '../components/HeartRateGraph';
import { useCycle } from '../context/CycleContext';
import './Insights.css';

const Insights = () => {
  const { bbtHistory, heartRateHistory, cycleHistory } = useCycle();
  const [activeTab, setActiveTab] = useState('bbt');
  
  // Calculate insights
  const avgCycleLength = cycleHistory.length > 0
    ? Math.round(cycleHistory.reduce((sum, c) => sum + c.length, 0) / cycleHistory.length)
    : 28;
  
  const avgBBT = bbtHistory.length > 0
    ? (bbtHistory.reduce((sum, d) => sum + d.temperature, 0) / bbtHistory.length).toFixed(2)
    : '--';
  
  const avgHR = heartRateHistory.length > 0
    ? Math.round(heartRateHistory.reduce((sum, d) => sum + d.heartRate, 0) / heartRateHistory.length)
    : '--';
  
  return (
    <div className="insights-page">
      <h1>Insights & Analysis</h1>
      
      <div className="insights-summary">
        <div className="insight-card">
          <span className="insight-icon">📅</span>
          <div className="insight-content">
            <span className="insight-value">{avgCycleLength} days</span>
            <span className="insight-label">Avg Cycle Length</span>
          </div>
        </div>
        
        <div className="insight-card">
          <span className="insight-icon">🌡️</span>
          <div className="insight-content">
            <span className="insight-value">{avgBBT}°C</span>
            <span className="insight-label">Avg BBT</span>
          </div>
        </div>
        
        <div className="insight-card">
          <span className="insight-icon">❤️</span>
          <div className="insight-content">
            <span className="insight-value">{avgHR} BPM</span>
            <span className="insight-label">Avg Heart Rate</span>
          </div>
        </div>
        
        <div className="insight-card">
          <span className="insight-icon">📊</span>
          <div className="insight-content">
            <span className="insight-value">{cycleHistory.length}</span>
            <span className="insight-label">Cycles Tracked</span>
          </div>
        </div>
      </div>
      
      <div className="graph-tabs">
        <button 
          className={`tab ${activeTab === 'bbt' ? 'active' : ''}`}
          onClick={() => setActiveTab('bbt')}
        >
          BBT Trend
        </button>
        <button 
          className={`tab ${activeTab === 'hr' ? 'active' : ''}`}
          onClick={() => setActiveTab('hr')}
        >
          Heart Rate
        </button>
      </div>
      
      <div className="graph-container">
        {activeTab === 'bbt' && <BBTGraph />}
        {activeTab === 'hr' && <HeartRateGraph />}
      </div>
      
      <section className="patterns-section">
        <h2>Pattern Analysis</h2>
        <div className="pattern-cards">
          <div className="pattern-card">
            <h3>Temperature Patterns</h3>
            <p>Your BBT typically rises after day 14, indicating ovulation.</p>
          </div>
          <div className="pattern-card">
            <h3>Heart Rate Variations</h3>
            <p>Heart rate tends to be slightly elevated during luteal phase.</p>
          </div>
          <div className="pattern-card">
            <h3>Cycle Regularity</h3>
            <p>Your cycles have been regular, varying by ±2 days.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Insights;
