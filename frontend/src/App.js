import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './Components/Chat';

const App = () => {
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true); // For loading state

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
    }
    setLoading(false); // Set loading to false once useEffect is done
  }, []);

  const handleLogin = (token) => {
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('authToken');
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <Router>
      <Routes>
        <Route
          path="/chat/:chat_id"
          element={<Chat />}
        />
        <Route
          path="/"
          element={!authToken ? <Login onLogin={handleLogin} /> : <Dashboard authToken={authToken} onLogout={handleLogout} />}
        />
      </Routes>
    </Router>

  );
};

export default App;
