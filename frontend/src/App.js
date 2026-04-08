import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WalletPage from './pages/WalletPage';
import OptionsPage from './pages/OptionsPage';
import FuturesPage from './pages/FuturesPage';
import GoldPage from './pages/GoldPage';
import TradingHistoryPage from './pages/TradingHistoryPage';
import AIInsightsPage from './pages/AIInsightsPage';
import AccountManagerPage from './pages/AccountManagerPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <div style={{ color: '#00d4ff', textAlign: 'center', marginTop: 100 }}>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);
  if (loading) return <div style={{ color: '#00d4ff', textAlign: 'center', marginTop: 100 }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/options" element={<ProtectedRoute><OptionsPage /></ProtectedRoute>} />
        <Route path="/futures" element={<ProtectedRoute><FuturesPage /></ProtectedRoute>} />
        <Route path="/gold" element={<ProtectedRoute><GoldPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><TradingHistoryPage /></ProtectedRoute>} />
        <Route path="/ai-insights" element={<ProtectedRoute><AIInsightsPage /></ProtectedRoute>} />
        <Route path="/account-manager" element={<ProtectedRoute><AccountManagerPage /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawalsPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
