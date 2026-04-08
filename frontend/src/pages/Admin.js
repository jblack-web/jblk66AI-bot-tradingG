import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as api } from '../services/api';

const MOCK_STATS = {
  totalUsers: 12840,
  activeContracts: 3291,
  dailyRevenue: 84200,
  platformVolume: 1240000,
  pendingWithdrawals: 14,
  withdrawMode: 'manual',
};

const MOCK_ACTIVITY = [
  { icon: '👤', msg: 'New user registered: john@example.com', time: '2 min ago' },
  { icon: '⛏️', msg: 'Mining contract started: 110 TH/s for 30 days', time: '5 min ago' },
  { icon: '💸', msg: 'Withdrawal request: 0.05 ETH — pending approval', time: '12 min ago' },
  { icon: '🛒', msg: 'New order placed: $2,499.99 (Antminer S19 Pro)', time: '18 min ago' },
  { icon: '⚠️', msg: 'Seller product submitted for review', time: '34 min ago' },
  { icon: '💳', msg: 'Deposit received: $500 USD from user@mail.com', time: '1 hr ago' },
];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    Promise.all([
      api.getStats().catch(() => MOCK_STATS),
      api.getActivity().catch(() => ({ activity: MOCK_ACTIVITY })),
    ]).then(([s, a]) => {
      setStats(s.stats || s);
      setActivity(a.activity || MOCK_ACTIVITY);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggleMode = async () => {
    const newMode = stats.withdrawMode === 'manual' ? 'auto' : 'manual';
    const confirmed = window.confirm(`Switch withdraw mode to ${newMode.toUpperCase()}?\n\n${newMode === 'manual' ? 'All withdrawals will require admin approval.' : 'Withdrawals will process instantly without approval.'}`);
    if (!confirmed) return;

    setToggling(true);
    try {
      await api.setWithdrawMode(newMode);
      setStats(s => ({ ...s, withdrawMode: newMode }));
      setMsg(`✓ Withdraw mode switched to ${newMode.toUpperCase()}`);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to update mode'));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  const isManual = stats?.withdrawMode === 'manual';

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🛡 Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Platform management and controls</p>
          </div>
          <div className="flex-wrap" style={{ gap: '0.5rem' }}>
            <Link to="/admin/users" className="btn btn-outline btn-sm">👥 Users</Link>
            <Link to="/admin/mining" className="btn btn-outline btn-sm">⛏️ Mining</Link>
            <Link to="/admin/marketplace" className="btn btn-outline btn-sm">🛒 Marketplace</Link>
            <Link to="/admin/settings" className="btn btn-outline btn-sm">⚙️ Settings</Link>
          </div>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        {/* ⚠️ WITHDRAW MODE TOGGLE — CRITICAL SECTION */}
        <div className="withdraw-mode-card">
          <div className="withdraw-mode-title">⚠️ WITHDRAW MODE CONTROL</div>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ marginBottom: '0.75rem' }}>
                <span className={`mode-badge-large ${isManual ? 'manual' : 'auto'}`}>
                  {isManual ? '🔒 MANUAL MODE' : '⚡ AUTO MODE'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400 }}>
                {isManual
                  ? '🔒 Manual Mode: Every withdrawal requires admin approval before processing. Pending: '
                  : '⚡ Auto Mode: Withdrawals are processed instantly without manual review. '}
                {isManual && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{stats?.pendingWithdrawals || 0} pending</span>}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
              <label className="toggle-switch" onClick={!toggling ? handleToggleMode : undefined} style={{ opacity: toggling ? 0.6 : 1 }}>
                <div className={`toggle-track ${isManual ? 'off' : 'on'}`}>
                  <div className="toggle-thumb" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isManual ? 'var(--danger)' : 'var(--success)' }}>
                  {isManual ? 'Manual' : 'Auto'}
                </span>
              </label>
              <button
                className={`btn btn-lg ${isManual ? 'btn-success' : 'btn-danger'}`}
                onClick={handleToggleMode}
                disabled={toggling}
              >
                {toggling ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Switching...</>
                  : isManual ? '⚡ Switch to AUTO Mode' : '🔒 Switch to MANUAL Mode'}
              </button>
            </div>
          </div>

          {isManual && stats?.pendingWithdrawals > 0 && (
            <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
              ⚠️ You have <strong>{stats.pendingWithdrawals} pending withdrawal requests</strong> awaiting approval.
              <Link to="/admin/settings" style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>Review Now →</Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Users', value: (stats?.totalUsers || 0).toLocaleString(), icon: '👥', color: 'var(--secondary)' },
            { label: 'Active Contracts', value: (stats?.activeContracts || 0).toLocaleString(), icon: '⛏️', color: 'var(--primary)' },
            { label: 'Daily Revenue', value: `$${(stats?.dailyRevenue || 0).toLocaleString()}`, icon: '💰', color: 'var(--success)' },
            { label: 'Platform Volume', value: `$${((stats?.platformVolume || 0) / 1000).toFixed(0)}k`, icon: '📈', color: 'var(--primary)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex" style={{ marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
                <span className="stat-label">{s.label}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Links + Activity */}
        <div className="grid-2">
          {/* Quick Links */}
          <div className="card">
            <div className="card-header"><span className="card-title">🔗 Quick Links</span></div>
            <div className="flex-col" style={{ gap: '0.5rem' }}>
              {[
                { to: '/admin/users', icon: '👥', label: 'Manage Users', sub: `${(stats?.totalUsers || 0).toLocaleString()} total` },
                { to: '/admin/mining', icon: '⛏️', label: 'Mining Management', sub: `${(stats?.activeContracts || 0).toLocaleString()} active` },
                { to: '/admin/marketplace', icon: '🛒', label: 'Marketplace', sub: 'Review products & orders' },
                { to: '/admin/settings', icon: '⚙️', label: 'Platform Settings', sub: 'Fees, rates, withdraw mode' },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', background: 'var(--bg)', borderRadius: 8, textDecoration: 'none', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1.4rem' }}>{link.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{link.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{link.sub}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>›</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card">
            <div className="card-header"><span className="card-title">🔔 Recent Activity</span></div>
            <div className="flex-col" style={{ gap: '0.6rem' }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem', background: 'var(--bg)', borderRadius: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{a.msg}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
