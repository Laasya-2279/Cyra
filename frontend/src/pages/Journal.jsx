import React, { useState } from 'react';
import { useCycle } from '../context/CycleContext';
import { formatDate } from '../utils/dateHelpers';
import './Journal.css';

const Journal = () => {
  const { journalEntries, addJournalEntry } = useCycle();
  const [showForm, setShowForm] = useState(false);
  const [entry, setEntry] = useState({
    mood: '',
    symptoms: [],
    notes: ''
  });
  
  const moods = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'energetic', emoji: '⚡', label: 'Energetic' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'irritable', emoji: '😤', label: 'Irritable' }
  ];
  
  const symptoms = [
    'Cramps', 'Headache', 'Bloating', 'Fatigue', 
    'Breast tenderness', 'Acne', 'Back pain', 'Nausea'
  ];
  
  const handleMoodSelect = (mood) => {
    setEntry({ ...entry, mood });
  };
  
  const handleSymptomToggle = (symptom) => {
    const newSymptoms = entry.symptoms.includes(symptom)
      ? entry.symptoms.filter(s => s !== symptom)
      : [...entry.symptoms, symptom];
    setEntry({ ...entry, symptoms: newSymptoms });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    addJournalEntry({
      ...entry,
      date: new Date().toISOString()
    });
    setEntry({ mood: '', symptoms: [], notes: '' });
    setShowForm(false);
  };
  
  return (
    <div className="journal-page">
      <header className="journal-header">
        <h1>Mood & Symptom Journal</h1>
        <button 
          className="add-entry-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Entry'}
        </button>
      </header>
      
      {showForm && (
        <form className="journal-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>How are you feeling?</h3>
            <div className="mood-selection">
              {moods.map(m => (
                <button
                  key={m.value}
                  type="button"
                  className={`mood-btn ${entry.mood === m.value ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(m.value)}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-section">
            <h3>Any symptoms?</h3>
            <div className="symptom-selection">
              {symptoms.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`symptom-btn ${entry.symptoms.includes(s) ? 'selected' : ''}`}
                  onClick={() => handleSymptomToggle(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-section">
            <h3>Notes (optional)</h3>
            <textarea
              value={entry.notes}
              onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
              placeholder="How was your day? Any observations..."
              rows={4}
            />
          </div>
          
          <button type="submit" className="submit-btn">
            Save Entry
          </button>
        </form>
      )}
      
      <div className="entries-list">
        <h2>Recent Entries</h2>
        {journalEntries.length === 0 ? (
          <p className="no-entries">No journal entries yet. Start tracking your mood!</p>
        ) : (
          journalEntries.map((entry, index) => (
            <div key={index} className="entry-card">
              <div className="entry-header">
                <span className="entry-date">{formatDate(entry.date)}</span>
                <span className="entry-mood">
                  {moods.find(m => m.value === entry.mood)?.emoji}
                </span>
              </div>
              {entry.symptoms.length > 0 && (
                <div className="entry-symptoms">
                  {entry.symptoms.map(s => (
                    <span key={s} className="symptom-tag">{s}</span>
                  ))}
                </div>
              )}
              {entry.notes && (
                <p className="entry-notes">{entry.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;
