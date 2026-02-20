import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { initSocket, onSensorUpdate, disconnectSocket } from '../services/socket';

/**
 * CycleContext - Global state for cycle data
 */

const CycleContext = createContext();

export const useCycle = () => {
  const context = useContext(CycleContext);
  if (!context) {
    throw new Error('useCycle must be used within a CycleProvider');
  }
  return context;
};

export const CycleProvider = ({ children }) => {
  // Cycle state
  const [currentPhase, setCurrentPhase] = useState('follicular');
  const [dayInCycle, setDayInCycle] = useState(8);
  const [cycleLength, setCycleLength] = useState(28);
  const [nextPeriodIn, setNextPeriodIn] = useState(20);
  
  // Sensor data
  const [liveData, setLiveData] = useState({ temperature: null, heartRate: null });
  const [bbtHistory, setBbtHistory] = useState([]);
  const [heartRateHistory, setHeartRateHistory] = useState([]);
  
  // Journal
  const [journalEntries, setJournalEntries] = useState([]);
  
  // Cycle history
  const [cycleHistory, setCycleHistory] = useState([]);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState({
    cycleLength: 28,
    periodLength: 5,
    notifications: true,
    deviceId: '',
    serverUrl: 'http://localhost:5000'
  });
  
  // Initialize socket connection
  useEffect(() => {
    const socket = initSocket();
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    const unsubscribe = onSensorUpdate((data) => {
      setLiveData({
        temperature: data.temperature,
        heartRate: data.heartRate
      });
    });
    
    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, []);
  
  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      // Fetch history
      const historyResponse = await api.getHistory('user_1', 30);
      if (historyResponse.data) {
        setBbtHistory(historyResponse.data.map(d => ({
          temperature: d.temperature,
          timestamp: d.timestamp
        })));
        setHeartRateHistory(historyResponse.data.map(d => ({
          heartRate: d.heartRate,
          timestamp: d.timestamp
        })));
      }
      
      // Fetch journal entries
      const journalResponse = await api.getJournalEntries('user_1');
      if (journalResponse.entries) {
        setJournalEntries(journalResponse.entries);
      }
      
      // Get phase prediction
      if (bbtHistory.length > 0) {
        const bbtValues = bbtHistory.map(d => d.temperature);
        const prediction = await api.predictPhase(bbtValues);
        if (prediction.phase) {
          setCurrentPhase(prediction.phase);
          setDayInCycle(prediction.day_in_cycle);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data if API fails
      loadMockData();
    }
  }, [bbtHistory.length]);
  
  // Load mock data for development
  const loadMockData = () => {
    const mockBBT = Array.from({ length: 14 }, (_, i) => ({
      temperature: 36.3 + Math.random() * 0.5,
      timestamp: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    const mockHR = Array.from({ length: 14 }, (_, i) => ({
      heartRate: 65 + Math.floor(Math.random() * 20),
      timestamp: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    setBbtHistory(mockBBT);
    setHeartRateHistory(mockHR);
    setLiveData({ temperature: 36.5, heartRate: 72 });
  };
  
  // Add journal entry
  const addJournalEntry = async (entry) => {
    try {
      await api.addJournalEntry({ ...entry, userId: 'user_1' });
      setJournalEntries([entry, ...journalEntries]);
    } catch (error) {
      console.error('Error adding journal entry:', error);
      // Add locally anyway
      setJournalEntries([entry, ...journalEntries]);
    }
  };
  
  // Update settings
  const updateSettings = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
    if (newSettings.cycleLength) {
      setCycleLength(newSettings.cycleLength);
    }
  };
  
  const value = {
    // Cycle data
    currentPhase,
    dayInCycle,
    cycleLength,
    nextPeriodIn,
    cycleHistory,
    
    // Sensor data
    liveData,
    bbtHistory,
    heartRateHistory,
    
    // Journal
    journalEntries,
    addJournalEntry,
    
    // Connection
    isConnected,
    
    // Settings
    settings,
    updateSettings,
    
    // Actions
    fetchData
  };
  
  return (
    <CycleContext.Provider value={value}>
      {children}
    </CycleContext.Provider>
  );
};

export default CycleContext;
