/**
 * Date formatting utilities
 * Helper functions for date operations in CycleAura
 */

/**
 * Format a date string or Date object
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type: 'full', 'short', 'time', 'relative'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'full') => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    case 'time':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    case 'relative':
      return getRelativeTime(d);
    
    case 'iso':
      return d.toISOString().split('T')[0];
    
    case 'full':
    default:
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
  }
};

/**
 * Get relative time string (e.g., "2 days ago")
 * @param {Date} date - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
};

/**
 * Calculate days between two dates
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @returns {number} Number of days
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end - start);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Add days to a date
 * @param {Date|string} date 
 * @param {number} days 
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get start of day
 * @param {Date|string} date 
 * @returns {Date} Date at midnight
 */
export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Check if two dates are the same day
 * @param {Date|string} date1 
 * @param {Date|string} date2 
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

export default {
  formatDate,
  getRelativeTime,
  daysBetween,
  addDays,
  startOfDay,
  isSameDay
};
