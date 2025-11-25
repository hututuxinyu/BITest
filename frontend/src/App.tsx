import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProjectManagement from './pages/ProjectManagement';
import type { User } from './types';

/**
 * 主应用组件
 */
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setUser({ userId } as User);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('userId', userData.userId);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/projects" replace /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/projects"
          element={
            user ? (
              <ProjectManagement user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

