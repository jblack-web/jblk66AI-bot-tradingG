import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TradingDashboard from './pages/TradingDashboard';
import AdminPanel from './pages/AdminPanel';
import AdminMembers from './pages/AdminMembers';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminPromotions from './pages/AdminPromotions';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/trading" element={<ProtectedRoute><TradingDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/members" element={<ProtectedRoute adminOnly><AdminMembers /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/promotions" element={<ProtectedRoute adminOnly><AdminPromotions /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
