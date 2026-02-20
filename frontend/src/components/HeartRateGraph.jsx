import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useCycle } from '../context/CycleContext';
import { formatDate } from '../utils/dateHelpers';
import './HeartRateGraph.css';

const HeartRateGraph = () => {
  const { heartRateHistory } = useCycle();
  
  const formattedData = heartRateHistory.map(entry => ({
    ...entry,
    date: formatDate(entry.timestamp, 'short'),
    hr: entry.heartRate
  }));
  
  // Calculate averages
  const avgHeartRate = heartRateHistory.length > 0
    ? Math.round(heartRateHistory.reduce((sum, d) => sum + d.heartRate, 0) / heartRateHistory.length)
    : 0;
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="hr-tooltip">
          <p className="date">{label}</p>
          <p className="hr">{payload[0].value} BPM</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="heart-rate-graph-container">
      <div className="hr-header">
        <h3>Heart Rate History</h3>
        <div className="hr-avg">
          <span className="avg-label">Avg:</span>
          <span className="avg-value">{avgHeartRate} BPM</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e91e63" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#e91e63" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            domain={[50, 100]} 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="hr" 
            stroke="#e91e63" 
            strokeWidth={2}
            fill="url(#hrGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="hr-zones">
        <div className="zone rest">
          <span className="zone-dot"></span>
          <span>Resting: 60-70</span>
        </div>
        <div className="zone normal">
          <span className="zone-dot"></span>
          <span>Normal: 70-85</span>
        </div>
        <div className="zone elevated">
          <span className="zone-dot"></span>
          <span>Elevated: 85+</span>
        </div>
      </div>
    </div>
  );
};

export default HeartRateGraph;
