import React, { useEffect } from 'react';
import { useCycle } from '../context/CycleContext';
import CycleWheel from '../components/CycleWheel';
import SensorCard from '../components/SensorCard';
import PhaseTimeline from '../components/PhaseTimeline';
import { PHASE_COLORS } from '../utils/phaseColors';
import './Dashboard.css';

const Dashboard = () => {
  const { currentPhase, dayInCycle, nextPeriodIn, fetchData } = useCycle();
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const phaseDescriptions = {
    menstrual: 'Your period phase. Rest and recover.',
    follicular: 'Energy is rising. Great time for new projects!',
    ovulatory: 'Peak energy and fertility window.',
    luteal: 'Winding down. Focus on self-care.'
  };
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome to CycleAura</h1>
        <p className="date">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </header>
      
      <div className="dashboard-grid">
        <section className="cycle-section">
          <CycleWheel />
          <div 
            className="phase-description"
            style={{ borderLeftColor: PHASE_COLORS[currentPhase] }}
          >
            <p>{phaseDescriptions[currentPhase]}</p>
          </div>
        </section>
        
        <section className="stats-section">
          <div className="stat-card">
            <span className="stat-value">{dayInCycle}</span>
            <span className="stat-label">Day of Cycle</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{nextPeriodIn}</span>
            <span className="stat-label">Days Until Period</span>
          </div>
        </section>
        
        <section className="sensors-section">
          <h2>Live Readings</h2>
          <div className="sensor-cards">
            <SensorCard type="temperature" />
            <SensorCard type="heartRate" />
          </div>
        </section>
        
        <section className="timeline-section">
          <PhaseTimeline />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
