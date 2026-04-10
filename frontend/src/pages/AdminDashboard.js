import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

// Sections
import DashboardHome from '../components/DashboardHome';
import TemplateLibrary from '../components/TemplateLibrary';
import PaymentPanel from '../components/PaymentPanel';
import WithdrawalSettings from '../components/WithdrawalSettings';
import UsersPanel from '../components/UsersPanel';
import TiersPanel from '../components/TiersPanel';
import PromoCodesPanel from '../components/PromoCodesPanel';
import LegalPanel from '../components/LegalPanel';
import MembershipUpgradePanel from '../components/MembershipUpgradePanel';

const navItems = [
  { section: 'Main', items: [
    { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { path: '/admin/templates', label: 'Template Library', icon: '🎨', badge: '5000+' },
    { path: '/admin/payments', label: 'Payments', icon: '💳' },
  ]},
  { section: 'Finance', items: [
    { path: '/admin/withdrawals', label: 'Withdrawals', icon: '💸' },
  ]},
  { section: 'Users', items: [
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/membership', label: 'Membership Upgrades', icon: '⭐' },
    { path: '/admin/tiers', label: 'Tier Packages', icon: '📦' },
    { path: '/admin/promo-codes', label: 'Promo Codes', icon: '🎁' },
  ]},
  { section: 'Legal', items: [
    { path: '/admin/legal', label: 'Legal & Compliance', icon: '⚖️', badge: 'New' },
  ]},
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const pageTitle = (() => {
    const p = location.pathname;
    if (p === '/admin') return 'Dashboard Overview';
    if (p.startsWith('/admin/templates')) return 'Template Library';
    if (p.startsWith('/admin/payments')) return 'Payment Management';
    if (p.startsWith('/admin/withdrawals')) return 'Withdrawal Settings';
    if (p.startsWith('/admin/users')) return 'User Management';
    if (p.startsWith('/admin/membership')) return 'Membership Upgrades';
    if (p.startsWith('/admin/tiers')) return 'Tier Packages';
    if (p.startsWith('/admin/promo-codes')) return 'Promo Codes';
    if (p.startsWith('/admin/legal')) return 'Legal & Compliance';
    return 'Admin Dashboard';
  })();

  return (
    <div className="app">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>⚡ JBLK66 AI</h1>
          <p>Trading Bot Admin</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(section => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              {section.items.map(item => (
                <div
                  key={item.path}
                  className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                >
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-badge" style={{ background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)' }}>{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            👤 {user?.username || 'Admin'} <span className="badge badge-blue" style={{ marginLeft: 4 }}>{user?.role}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 20, display: 'none' }}
              className="menu-btn"
            >
              ☰
            </button>
            <h1 className="topbar-title">{pageTitle}</h1>
          </div>
          <div className="topbar-right">
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <div style={{ width: 36, height: 36, background: 'var(--accent-blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {(user?.username || 'A')[0].toUpperCase()}
            </div>
          </div>
        </div>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/templates/*" element={<TemplateLibrary />} />
            <Route path="/payments" element={<PaymentPanel />} />
            <Route path="/withdrawals" element={<WithdrawalSettings />} />
            <Route path="/users" element={<UsersPanel />} />
            <Route path="/membership" element={<MembershipUpgradePanel />} />
            <Route path="/tiers" element={<TiersPanel />} />
            <Route path="/promo-codes" element={<PromoCodesPanel />} />
            <Route path="/legal" element={<LegalPanel />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
