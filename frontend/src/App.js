import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Components
import BottomNav from './components/BottomNav';
import TopHeader from './components/TopHeader';
import PinSetup from './pages/PinSetup';
import Login from './pages/Login';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Expenses from './pages/Expenses';
import CheckIn from './pages/CheckIn';
import Documents from './pages/Documents';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import Places from './pages/Places';
import Alerts from './pages/Alerts';
import Important from './pages/Important';
import Bin from './pages/Bin';
import Checklist from './pages/Checklist';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Life OS...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--primary-1)',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--primary-3)',
                  secondary: 'white',
                },
              },
            }}
          />
          
          {isAuthenticated && <TopHeader />}
          
          <Routes>
            <Route path="/setup" element={<PinSetup />} />
            <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
            
            {isAuthenticated ? (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/checkin" element={<CheckIn />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/profile" element={<Profile setAuth={setIsAuthenticated} />} />
                <Route path="/places" element={<Places />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/important" element={<Important />} />
                <Route path="/bin" element={<Bin />} />
                <Route path="/checklist" element={<Checklist />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" />} />
            )}
          </Routes>
          
          {isAuthenticated && <BottomNav />}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;