import React from 'react';
import { useCycle } from '../context/CycleContext';
import { PHASE_COLORS } from '../utils/phaseColors';
import './CycleWheel.css';

const CycleWheel = () => {
  const { currentPhase, dayInCycle, cycleLength } = useCycle();
  
  const phases = [
    { name: 'menstrual', label: 'Menstrual', days: '1-5' },
    { name: 'follicular', label: 'Follicular', days: '6-13' },
    { name: 'ovulatory', label: 'Ovulatory', days: '14-16' },
    { name: 'luteal', label: 'Luteal', days: '17-28' }
  ];
  
  const getRotation = () => {
    const progress = (dayInCycle / cycleLength) * 360;
    return progress;
  };
  
  const isActivePhase = (phaseName) => {
    return currentPhase === phaseName;
  };
  
  return (
    <div className="cycle-wheel-container">
      <svg viewBox="0 0 200 200" className="cycle-wheel">
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="#f8f9fa" />
        
        {/* Phase segments */}
        {phases.map((phase, index) => {
          const startAngle = (index * 90) - 90;
          const endAngle = startAngle + 90;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          const x1 = 100 + 80 * Math.cos(startRad);
          const y1 = 100 + 80 * Math.sin(startRad);
          const x2 = 100 + 80 * Math.cos(endRad);
          const y2 = 100 + 80 * Math.sin(endRad);
          
          return (
            <path
              key={phase.name}
              d={`M 100 100 L ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2} Z`}
              fill={PHASE_COLORS[phase.name]}
              opacity={isActivePhase(phase.name) ? 1 : 0.4}
              className={`phase-segment ${isActivePhase(phase.name) ? 'active' : ''}`}
            />
          );
        })}
        
        {/* Center circle */}
        <circle cx="100" cy="100" r="50" fill="white" />
        
        {/* Day indicator */}
        <text x="100" y="95" textAnchor="middle" className="day-number">
          {dayInCycle}
        </text>
        <text x="100" y="115" textAnchor="middle" className="day-label">
          Day
        </text>
        
        {/* Current position indicator */}
        <g transform={`rotate(${getRotation()}, 100, 100)`}>
          <circle cx="100" cy="25" r="6" fill="#333" />
        </g>
      </svg>
      
      <div className="phase-info">
        <h3 style={{ color: PHASE_COLORS[currentPhase] }}>
          {phases.find(p => p.name === currentPhase)?.label || 'Unknown'}
        </h3>
        <p>Phase</p>
      </div>
    </div>
  );
};

export default CycleWheel;
