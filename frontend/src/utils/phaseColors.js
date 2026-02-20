/**
 * Phase color constants
 * Consistent colors for each cycle phase throughout the app
 */

export const PHASE_COLORS = {
  menstrual: '#e91e63',    // Pink/Red
  follicular: '#9c27b0',   // Purple
  ovulatory: '#ff9800',    // Orange
  luteal: '#4caf50'        // Green
};

export const PHASE_COLORS_LIGHT = {
  menstrual: '#f8bbd9',
  follicular: '#e1bee7',
  ovulatory: '#ffe0b2',
  luteal: '#c8e6c9'
};

export const PHASE_GRADIENTS = {
  menstrual: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
  follicular: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
  ovulatory: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
  luteal: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
};

export default PHASE_COLORS;
