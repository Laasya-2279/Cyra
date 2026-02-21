import { io } from 'socket.io-client';

/**
 * Socket.io client setup
 * Real-time communication with CyRa server
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize socket connection
 */
export const initSocket = () => {
  if (socket) return socket;

  socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  return socket;
};

/**
 * Get existing socket instance
 */
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join user-specific room for targeted updates
 */
export const joinUserRoom = (userId) => {
  const s = getSocket();
  s.emit('join_user_room', { userId });
};

/**
 * Leave user room
 */
export const leaveUserRoom = (userId) => {
  const s = getSocket();
  s.emit('leave_user_room', { userId });
};

/**
 * Subscribe to sensor updates
 */
export const onSensorUpdate = (callback) => {
  const s = getSocket();
  s.on('sensor_update', callback);

  return () => {
    s.off('sensor_update', callback);
  };
};

/**
 * Subscribe to phase changes
 */
export const onPhaseChange = (callback) => {
  const s = getSocket();
  s.on('phase_changed', callback);

  return () => {
    s.off('phase_changed', callback);
  };
};

/**
 * Request live data streaming
 */
export const requestLiveData = (deviceId) => {
  const s = getSocket();
  s.emit('request_live_data', { deviceId });
};

/**
 * Stop live data streaming
 */
export const stopLiveData = (deviceId) => {
  const s = getSocket();
  s.emit('stop_live_data', { deviceId });
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinUserRoom,
  leaveUserRoom,
  onSensorUpdate,
  onPhaseChange,
  requestLiveData,
  stopLiveData
};
