import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { initSocket, onSensorUpdate, disconnectSocket } from '../services/socket';

/**
 * CycleContext - Global state for cycle data
 * Uses authenticated user's ID for all API calls
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
  const { user, isAuthenticated } = useAuth();
  const userId = user?.user_id || null;

  // Cycle state
  const [currentPhase, setCurrentPhase] = useState('follicular');
  const [dayInCycle, setDayInCycle] = useState(1);
  const [cycleLength, setCycleLength] = useState(28);
  const [nextPeriodIn, setNextPeriodIn] = useState(14);

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

    // Listen for real-time BBT updates from ESP32
    // Accept data from any device — in practice one ESP32 serves one user
    socket.on('bbt_update', (data) => {
      setLiveData(prev => ({ ...prev, temperature: data.bbt }));
      if (data.prediction) {
        applyPrediction(data.prediction);
      }
    });

    // Listen for real-time heart rate updates from ESP32
    socket.on('heartrate_update', (data) => {
      setLiveData(prev => ({ ...prev, heartRate: data.bpm }));
    });

    const unsubscribe = onSensorUpdate((data) => {
      setLiveData({
        temperature: data.temperature ?? data.bbt ?? null,
        heartRate: data.heartRate ?? data.bpm ?? null,
      });
    });

    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, []);

  // Apply prediction data to state
  const applyPrediction = (pred) => {
    if (pred.phase && pred.phase !== 'Unknown') {
      setCurrentPhase(pred.phase.toLowerCase());
    }
    if (pred.next_period_in_days != null) {
      setNextPeriodIn(pred.next_period_in_days);
    }
    if (pred.cycle_length_est) {
      setCycleLength(Math.round(pred.cycle_length_est));
    }
  };

  // Fetch initial data when user is authenticated
  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch BBT history
      const bbtRes = await api.getBBTHistory(userId, 30);
      const bbtData = bbtRes.history || [];
      setBbtHistory(bbtData.map(d => ({
        temperature: d.bbt_celsius,
        timestamp: d.timestamp,
      })));

      // Fetch heart rate history
      const hrRes = await api.getHeartRateHistory(userId, 30);
      const hrData = hrRes.history || [];
      setHeartRateHistory(hrData.map(d => ({
        heartRate: d.bpm,
        timestamp: d.timestamp,
      })));

      // Set live data from latest readings
      if (bbtData.length > 0) {
        setLiveData(prev => ({ ...prev, temperature: bbtData[0].bbt_celsius }));
      }
      if (hrData.length > 0) {
        setLiveData(prev => ({ ...prev, heartRate: hrData[0].bpm }));
      }

      // Fetch journal entries
      const journalRes = await api.getJournalEntries(userId);
      if (journalRes.entries) {
        setJournalEntries(journalRes.entries);
      }

      // Get prediction from backend
      const prediction = await api.getPrediction(userId);
      applyPrediction(prediction);

    } catch (error) {
      console.error('Error fetching data:', error);
      loadMockData();
    }
  }, [userId]);

  // Auto-fetch when user logs in
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchData();
    }
  }, [isAuthenticated, userId, fetchData]);

  // Load mock data for development / fallback
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
      if (userId) {
        const res = await api.addJournalEntry(userId, entry);
        // If prediction came back, apply it
        if (res.prediction) {
          applyPrediction(res.prediction);
        }
      }
      setJournalEntries([{ ...entry, timestamp: new Date().toISOString() }, ...journalEntries]);
    } catch (error) {
      console.error('Error adding journal entry:', error);
      setJournalEntries([{ ...entry, timestamp: new Date().toISOString() }, ...journalEntries]);
    }
  };

  // Update settings — also save to backend profile
  const updateSettings = async (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    if (newSettings.cycleLength) {
      setCycleLength(newSettings.cycleLength);
    }
    // Persist to backend
    if (userId) {
      try {
        await api.saveUserProfile(userId, newSettings);
      } catch (err) {
        console.error('Error saving settings to backend:', err);
      }
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
