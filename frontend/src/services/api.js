import { API_BASE_URL } from './socket';

/**
 * API service for CyRa
 * All endpoints match the Flask backend routes in app.py
 */

// Helper: get auth token from localStorage
function authHeaders() {
  const token = localStorage.getItem('ca_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

const api = {
  /* ── Sensor data (used by CycleContext) ────────────────────── */

  async sendBBT(userId, bbt) {
    const res = await fetch(`${API_BASE_URL}/api/sensor/bbt`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ user_id: userId, bbt }),
    });
    return res.json();
  },

  async sendHeartRate(userId, data) {
    const res = await fetch(`${API_BASE_URL}/api/sensor/heartrate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ user_id: userId, ...data }),
    });
    return res.json();
  },

  /* ── Predictions ──────────────────────────────────────────── */

  async getPrediction(userId) {
    const res = await fetch(
      `${API_BASE_URL}/api/cycle/prediction?user_id=${userId}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  /* ── History ──────────────────────────────────────────────── */

  async getBBTHistory(userId, limit = 30) {
    const res = await fetch(
      `${API_BASE_URL}/api/cycle/history?user_id=${userId}&limit=${limit}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  async getHeartRateHistory(userId, limit = 30) {
    const res = await fetch(
      `${API_BASE_URL}/api/cycle/heartrate-history?user_id=${userId}&limit=${limit}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  /* ── Journal ──────────────────────────────────────────────── */

  async addJournalEntry(userId, entry) {
    const res = await fetch(`${API_BASE_URL}/api/journal/entry`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ user_id: userId, ...entry }),
    });
    return res.json();
  },

  async getJournalEntries(userId) {
    const res = await fetch(
      `${API_BASE_URL}/api/journal/entries?user_id=${userId}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  /* ── Tips ──────────────────────────────────────────────────── */

  async getTips(userId) {
    const res = await fetch(
      `${API_BASE_URL}/api/tips/today?user_id=${userId}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  /* ── User Profile ─────────────────────────────────────────── */

  async getUserProfile(userId) {
    const res = await fetch(
      `${API_BASE_URL}/api/user/profile?user_id=${userId}`,
      { headers: authHeaders() }
    );
    return res.json();
  },

  async saveUserProfile(userId, profile) {
    const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ user_id: userId, ...profile }),
    });
    return res.json();
  },

  /* ── Health check ─────────────────────────────────────────── */

  async healthCheck() {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.json();
  },
};

export default api;
