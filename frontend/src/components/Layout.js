import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const S = {
  container: { display: 'flex', minHeight: '100vh', background: '#0a0e1a' },
  sidebar: { width: 220, background: '#0d1226', borderRight: '1px solid #1a2040', display: 'flex', flexDirection: 'column', padding: '20px 0' },
  logo: { color: '#00d4ff', fontSize: 22, fontWeight: 700, padding: '0 20px 24px', borderBottom: '1px solid #1a2040', marginBottom: 12 },
  navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', color: active ? '#00d4ff' : '#8899aa', textDecoration: 'none', borderLeft: active ? '3px solid #00d4ff' : '3px solid transparent', background: active ? 'rgba(0,212,255,0.07)' : 'transparent', fontSize: 14, transition: 'all 0.2s' }),
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { background: '#0d1226', borderBottom: '1px solid #1a2040', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  content: { flex: 1, padding: 28, overflowY: 'auto' },
  badge: (tier) => ({ background: tier === 'PREMIUM' ? '#7c3aed' : tier === 'ADVANCED' ? '#00d4ff' : '#334', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }),
  logoutBtn: { background: 'none', border: '1px solid #ff4444', color: '#ff4444', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
};

const navLinks = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/wallet', label: '💰 Wallet' },
  { to: '/options', label: '📈 Options' },
  { to: '/futures', label: '🔮 Futures' },
  { to: '/gold', label: '🥇 Gold' },
  { to: '/history', label: '📋 History' },
  { to: '/ai-insights', label: '🤖 AI Insights' },
  { to: '/account-manager', label: '👔 Account Manager' },
  { to: '/subscriptions', label: '⭐ Subscriptions' },
  { to: '/notifications', label: '🔔 Notifications' },
  { to: '/profile', label: '👤 Profile' },
];

const adminLinks = [
  { to: '/admin', label: '🛡 Admin Dashboard' },
  { to: '/admin/users', label: '👥 Users' },
  { to: '/admin/withdrawals', label: '💸 Withdrawals' },
  { to: '/admin/settings', label: '⚙️ Settings' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={S.container}>
      <div style={{ ...S.sidebar, width: collapsed ? 60 : 220, overflow: 'hidden' }}>
        <div style={S.logo} onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
          {collapsed ? '⚡' : '⚡ jblk66AI'}
        </div>
        {navLinks.map(({ to, label }) => (
          <Link key={to} to={to} style={S.navItem(location.pathname === to)}>
            {collapsed ? label.split(' ')[0] : label}
          </Link>
        ))}
        {isAdmin && (
          <>
            <div style={{ borderTop: '1px solid #1a2040', margin: '12px 0 8px', paddingTop: 8, paddingLeft: 20, color: '#556', fontSize: 11, textTransform: 'uppercase' }}>
              {!collapsed && 'Admin'}
            </div>
            {adminLinks.map(({ to, label }) => (
              <Link key={to} to={to} style={S.navItem(location.pathname === to)}>
                {collapsed ? label.split(' ')[0] : label}
              </Link>
            ))}
          </>
        )}
      </div>
      <div style={S.main}>
        <div style={S.header}>
          <span style={{ color: '#8899aa', fontSize: 14 }}>Welcome, <b style={{ color: '#e0e0e0' }}>{user?.name || 'Trader'}</b></span>
          <div style={S.headerRight}>
            <span style={S.badge(user?.tier || 'BASIC')}>{user?.tier || 'BASIC'}</span>
            <span style={{ color: '#00c851', fontWeight: 700, fontSize: 14 }}>${(user?.walletBalance || 0).toLocaleString()}</span>
            <Link to="/notifications" style={{ color: '#8899aa', fontSize: 20, textDecoration: 'none' }}>🔔</Link>
            <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div style={S.content}>{children}</div>
      </div>
    </div>
  );
}
