import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useCycle } from '../context/CycleContext';
import { formatDate } from '../utils/dateHelpers';
import './BBTGraph.css';

const BBTGraph = () => {
  const { bbtHistory } = useCycle();
  
  // Calculate baseline and ovulation threshold
  const temperatures = bbtHistory.map(d => d.temperature);
  const baseline = temperatures.length > 0 
    ? (Math.min(...temperatures) + Math.max(...temperatures)) / 2 
    : 36.5;
  
  const formattedData = bbtHistory.map(entry => ({
    ...entry,
    date: formatDate(entry.timestamp, 'short'),
    temp: entry.temperature
  }));
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bbt-tooltip">
          <p className="date">{label}</p>
          <p className="temp">{payload[0].value.toFixed(2)}°C</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bbt-graph-container">
      <h3>BBT Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            domain={[36, 37.2]} 
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(value) => `${value}°`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={baseline} 
            stroke="#ff6b9d" 
            strokeDasharray="5 5" 
            label="Baseline"
          />
          <Line 
            type="monotone" 
            dataKey="temp" 
            stroke="#ff6b9d" 
            strokeWidth={2}
            dot={{ fill: '#ff6b9d', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#ff4081' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="graph-note">
        Temperature rise of 0.3-0.5°C indicates ovulation
      </p>
    </div>
  );
};

export default BBTGraph;
