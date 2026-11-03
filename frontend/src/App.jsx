import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import EventsPage from './pages/EventsPage';
import TemplatesPage from './pages/TemplatesPage';
import GenerateSinglePage from './pages/GenerateSinglePage';
import BulkGeneratePage from './pages/BulkGeneratePage';
import HistoryPage from './pages/HistoryPage';
import VerifyPage from './pages/VerifyPage';

import './App.css';

// Protected Layout Component
function ProtectedLayout({ adminUser, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Navbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          adminUser={adminUser}
          onLogout={onLogout}
        />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setAdminUser(null);
  };

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Verification Pages (no login needed) */}
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/:certificateId" element={<VerifyPage />} />

          {/* Admin Login */}
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedLayout adminUser={adminUser} onLogout={handleLogout} />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/generate" element={<GenerateSinglePage />} />
            <Route path="/bulk" element={<BulkGeneratePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
