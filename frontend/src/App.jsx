import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CycleProvider } from './context/CycleContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Journal from './pages/Journal';
import Tips from './pages/Tips';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <CycleProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CycleProvider>
  );
}

export default App;
