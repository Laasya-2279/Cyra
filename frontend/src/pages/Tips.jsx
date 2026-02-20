import React from 'react';
import { useCycle } from '../context/CycleContext';
import { PHASE_COLORS } from '../utils/phaseColors';
import './Tips.css';

const Tips = () => {
  const { currentPhase } = useCycle();
  
  const phaseTips = {
    menstrual: {
      title: 'Menstrual Phase',
      subtitle: 'Time to rest and restore',
      nutrition: [
        'Increase iron-rich foods like spinach and red meat',
        'Stay hydrated with warm beverages',
        'Dark chocolate can help with cravings',
        'Anti-inflammatory foods like ginger and turmeric'
      ],
      exercise: [
        'Light yoga and stretching',
        'Gentle walks',
        'Rest if needed',
        'Avoid high-intensity workouts'
      ],
      wellness: [
        'Prioritize sleep and rest',
        'Use heat therapy for cramps',
        'Practice self-compassion',
        'Light journaling or meditation'
      ]
    },
    follicular: {
      title: 'Follicular Phase',
      subtitle: 'Rising energy and creativity',
      nutrition: [
        'Focus on lean proteins',
        'Fresh vegetables and sprouts',
        'Complex carbohydrates',
        'Probiotic-rich foods'
      ],
      exercise: [
        'Great time for cardio workouts',
        'Try new exercise classes',
        'Strength training',
        'High-energy activities'
      ],
      wellness: [
        'Start new projects',
        'Social activities',
        'Creative pursuits',
        'Set new goals'
      ]
    },
    ovulatory: {
      title: 'Ovulatory Phase',
      subtitle: 'Peak energy and confidence',
      nutrition: [
        'Light, fresh meals',
        'Plenty of raw vegetables',
        'Fiber-rich foods',
        'Stay well hydrated'
      ],
      exercise: [
        'High-intensity interval training',
        'Group fitness classes',
        'Challenging workouts',
        'Peak performance activities'
      ],
      wellness: [
        'Important conversations',
        'Social events',
        'Public speaking',
        'Networking opportunities'
      ]
    },
    luteal: {
      title: 'Luteal Phase',
      subtitle: 'Time to slow down',
      nutrition: [
        'Magnesium-rich foods (dark chocolate, nuts)',
        'Complex carbs to boost serotonin',
        'B-vitamin foods',
        'Reduce salt and caffeine'
      ],
      exercise: [
        'Moderate intensity workouts',
        'Pilates and yoga',
        'Swimming',
        'Long walks'
      ],
      wellness: [
        'Prioritize sleep',
        'Stress management',
        'Cozy self-care activities',
        'Prepare for next cycle'
      ]
    }
  };
  
  const currentTips = phaseTips[currentPhase] || phaseTips.follicular;
  
  return (
    <div className="tips-page">
      <header 
        className="tips-header"
        style={{ borderBottomColor: PHASE_COLORS[currentPhase] }}
      >
        <h1>{currentTips.title}</h1>
        <p className="subtitle">{currentTips.subtitle}</p>
      </header>
      
      <div className="tips-grid">
        <section className="tips-section nutrition">
          <div className="section-header">
            <span className="section-icon">🥗</span>
            <h2>Nutrition</h2>
          </div>
          <ul className="tips-list">
            {currentTips.nutrition.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
        
        <section className="tips-section exercise">
          <div className="section-header">
            <span className="section-icon">🏃‍♀️</span>
            <h2>Exercise</h2>
          </div>
          <ul className="tips-list">
            {currentTips.exercise.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
        
        <section className="tips-section wellness">
          <div className="section-header">
            <span className="section-icon">🧘‍♀️</span>
            <h2>Wellness</h2>
          </div>
          <ul className="tips-list">
            {currentTips.wellness.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
      
      <div className="phase-selector">
        <h3>View Tips for Other Phases</h3>
        <div className="phase-buttons">
          {Object.keys(phaseTips).map(phase => (
            <button
              key={phase}
              className={`phase-btn ${phase === currentPhase ? 'active' : ''}`}
              style={{ 
                backgroundColor: phase === currentPhase ? PHASE_COLORS[phase] : 'transparent',
                borderColor: PHASE_COLORS[phase]
              }}
            >
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tips;
