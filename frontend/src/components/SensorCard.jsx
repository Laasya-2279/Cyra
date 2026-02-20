import React from 'react';
import { useCycle } from '../context/CycleContext';
import './SensorCard.css';

const SensorCard = ({ type }) => {
  const { liveData, isConnected } = useCycle();
  
  const config = {
    temperature: {
      label: 'Body Temperature',
      value: liveData?.temperature?.toFixed(2) || '--',
      unit: '°C',
      icon: '🌡️',
      color: '#ff6b9d',
      normalRange: '36.1 - 36.6°C'
    },
    heartRate: {
      label: 'Heart Rate',
      value: liveData?.heartRate || '--',
      unit: 'BPM',
      icon: '❤️',
      color: '#e91e63',
      normalRange: '60 - 100 BPM'
    }
  };
  
  const cardConfig = config[type];
  
  if (!cardConfig) return null;
  
  return (
    <div className="sensor-card" style={{ borderColor: cardConfig.color }}>
      <div className="sensor-header">
        <span className="sensor-icon">{cardConfig.icon}</span>
        <span className="sensor-label">{cardConfig.label}</span>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Live' : '○ Offline'}
        </span>
      </div>
      
      <div className="sensor-value">
        <span className="value" style={{ color: cardConfig.color }}>
          {cardConfig.value}
        </span>
        <span className="unit">{cardConfig.unit}</span>
      </div>
      
      <div className="sensor-footer">
        <span className="normal-range">Normal: {cardConfig.normalRange}</span>
      </div>
    </div>
  );
};

export default SensorCard;
