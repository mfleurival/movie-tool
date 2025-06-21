import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import Export from './pages/Export';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Dashboard - Project list and creation */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Project workspace */}
          <Route path="/project/:projectId" element={<Project />} />
          
          {/* Export page */}
          <Route path="/project/:projectId/export" element={<Export />} />
          
          {/* Redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;