import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateApp from './pages/CreateApp';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-gray-800 p-4 text-white">
          <div className="container mx-auto flex items-center">
            <Link to="/" className="text-xl font-bold tracking-wider">OpsForge Portal</Link>
          </div>
        </nav>
        
        <main className="py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateApp />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
