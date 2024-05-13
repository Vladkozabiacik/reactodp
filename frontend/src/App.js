import React, { useState, useEffect } from 'react';
import './App.css';
import Chat from './Components/Chat';
import Login from './Components/Login';

const App = () => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  const handleLogin = (token) => {
    setAuthToken(token);
    localStorage.setItem('authToken', token);

  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  return (
    <div>
      {!authToken ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div>
          <h1>Welcome, {user && user.username}!</h1>
          <button onClick={handleLogout}>Logout</button>
          <Chat user={user} />
        </div>
      )}
    </div>
  );
};

export default App;
