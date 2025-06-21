import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import ProjectEditor from './pages/ProjectEditor';
import Export from './pages/Export';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects/:id" element={<Project />} />
            <Route path="/projects/:id/edit" element={<ProjectEditor />} />
            <Route path="/projects/:id/export" element={<Export />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;