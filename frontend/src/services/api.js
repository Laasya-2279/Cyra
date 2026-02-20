import { API_BASE_URL } from './socket';

/**
 * API service for CycleAura
 * All API call functions
 */

const api = {
  /**
   * Send sensor data to server
   */
  async sendSensorData(data) {
    const response = await fetch(`${API_BASE_URL}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  /**
   * Get cycle phase prediction
   */
  async predictPhase(bbtData) {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bbt_data: bbtData })
    });
    return response.json();
  },

  /**
   * Get historical sensor data
   */
  async getHistory(userId, days = 30) {
    const response = await fetch(
      `${API_BASE_URL}/api/history?user_id=${userId}&days=${days}`
    );
    return response.json();
  },

  /**
   * Add journal entry
   */
  async addJournalEntry(entry) {
    const response = await fetch(`${API_BASE_URL}/api/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return response.json();
  },

  /**
   * Get journal entries
   */
  async getJournalEntries(userId) {
    const response = await fetch(
      `${API_BASE_URL}/api/journal?user_id=${userId}`
    );
    return response.json();
  },

  /**
   * Get phase-based health tips
   */
  async getTips(phase) {
    const response = await fetch(
      `${API_BASE_URL}/api/tips?phase=${phase}`
    );
    return response.json();
  },

  /**
   * Health check endpoint
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  }
};

export default api;
