import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Mining from './pages/Mining';
import MiningDetail from './pages/MiningDetail';
import Wallet from './pages/Wallet';
import WalletSend from './pages/WalletSend';
import WalletReceive from './pages/WalletReceive';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import AdminMining from './pages/AdminMining';
import AdminMarketplace from './pages/AdminMarketplace';
import AdminSettings from './pages/AdminSettings';
import Seller from './pages/Seller';
import Referrals from './pages/Referrals';

function PrivateRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner-lg" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ProductDetail />} />
        <Route path="/mining" element={<Mining />} />
        <Route path="/mining/:id" element={<MiningDetail />} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
        <Route path="/wallet/send" element={<PrivateRoute><WalletSend /></PrivateRoute>} />
        <Route path="/wallet/receive" element={<PrivateRoute><WalletReceive /></PrivateRoute>} />
        <Route path="/referrals" element={<PrivateRoute><Referrals /></PrivateRoute>} />
        <Route path="/seller" element={<PrivateRoute><Seller /></PrivateRoute>} />

        <Route path="/admin" element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/mining" element={<PrivateRoute adminOnly><AdminMining /></PrivateRoute>} />
        <Route path="/admin/marketplace" element={<PrivateRoute adminOnly><AdminMarketplace /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute adminOnly><AdminSettings /></PrivateRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function NotFound() {
  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="empty-state" style={{ paddingTop: '6rem' }}>
          <div className="empty-icon">🔍</div>
          <h3>404 — Page Not Found</h3>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Go Home</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
