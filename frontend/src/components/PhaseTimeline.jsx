import React from 'react';
import { useCycle } from '../context/CycleContext';
import { PHASE_COLORS } from '../utils/phaseColors';
import './PhaseTimeline.css';

const PhaseTimeline = () => {
  const { currentPhase, dayInCycle, cycleLength } = useCycle();
  
  const phases = [
    { name: 'menstrual', label: 'Menstrual', startDay: 1, endDay: 5 },
    { name: 'follicular', label: 'Follicular', startDay: 6, endDay: 13 },
    { name: 'ovulatory', label: 'Ovulatory', startDay: 14, endDay: 16 },
    { name: 'luteal', label: 'Luteal', startDay: 17, endDay: 28 }
  ];
  
  const getPhaseWidth = (phase) => {
    const duration = phase.endDay - phase.startDay + 1;
    return (duration / cycleLength) * 100;
  };
  
  const getProgressPosition = () => {
    return ((dayInCycle - 0.5) / cycleLength) * 100;
  };
  
  return (
    <div className="phase-timeline-container">
      <h3>Cycle Timeline</h3>
      
      <div className="timeline">
        <div className="phases-bar">
          {phases.map(phase => (
            <div
              key={phase.name}
              className={`phase-segment ${currentPhase === phase.name ? 'active' : ''}`}
              style={{
                width: `${getPhaseWidth(phase)}%`,
                backgroundColor: PHASE_COLORS[phase.name]
              }}
            >
              <span className="phase-label">{phase.label}</span>
            </div>
          ))}
        </div>
        
        <div 
          className="progress-indicator"
          style={{ left: `${getProgressPosition()}%` }}
        >
          <div className="indicator-line"></div>
          <div className="indicator-dot"></div>
          <div className="day-badge">Day {dayInCycle}</div>
        </div>
      </div>
      
      <div className="timeline-labels">
        <span>Day 1</span>
        <span>Day {Math.round(cycleLength / 2)}</span>
        <span>Day {cycleLength}</span>
      </div>
      
      <div className="phase-legend">
        {phases.map(phase => (
          <div key={phase.name} className="legend-item">
            <span 
              className="legend-dot" 
              style={{ backgroundColor: PHASE_COLORS[phase.name] }}
            ></span>
            <span className="legend-label">{phase.label}</span>
            <span className="legend-days">Days {phase.startDay}-{phase.endDay}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseTimeline;
