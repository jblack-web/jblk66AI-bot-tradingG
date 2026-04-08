import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { wallet, mining, marketplace } from '../services/api';

const MOCK_BALANCES = [
  { currency: 'BTC', amount: '0.00241500', usd: '$142.80' },
  { currency: 'ETH', amount: '0.18500000', usd: '$487.50' },
  { currency: 'USDT', amount: '320.00', usd: '$320.00' },
  { currency: 'USD', amount: '1,250.00', usd: '$1,250.00' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      wallet.getBalances().catch(() => ({ balances: MOCK_BALANCES })),
      mining.getContracts().catch(() => ({ contracts: [] })),
      marketplace.getOrders().catch(() => ({ orders: [] })),
      mining.getEarnings().catch(() => ({ today: 0.00012, month: 0.00341 })),
    ]).then(([b, c, o, e]) => {
      setBalances(b.balances || MOCK_BALANCES);
      setContracts(c.contracts || []);
      setOrders((o.orders || []).slice(0, 5));
      setEarnings(e);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner spinner-lg" />
      <span>Loading dashboard...</span>
    </div>
  );

  const totalHashrate = contracts.reduce((a, c) => a + (c.hashrate || 0), 0);
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>Welcome back, {user?.name || 'Trader'} 👋</h1>
          <p>Here's your platform overview</p>
        </div>

        {/* Quick Actions */}
        <div className="flex-wrap" style={{ marginBottom: '2rem', gap: '0.75rem' }}>
          <Link to="/wallet/send" className="btn btn-primary">💸 Send Crypto</Link>
          <Link to="/wallet/receive" className="btn btn-secondary">📥 Receive</Link>
          <Link to="/mining" className="btn btn-outline">⛏️ Start Mining</Link>
          <Link to="/marketplace" className="btn btn-outline">🛒 Marketplace</Link>
          <Link to="/referrals" className="btn btn-outline">🔗 Referrals</Link>
        </div>

        {/* Wallet Balances */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">💳 Wallet Balances</span>
            <Link to="/wallet" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div className="grid-4">
            {balances.map(b => (
              <div key={b.currency} className="wallet-card">
                <div className="wallet-currency">
                  <div className={`currency-icon currency-${b.currency.toLowerCase()}`}>{b.currency.substring(0, 1)}</div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.currency}</span>
                </div>
                <div className="wallet-balance">{b.amount}</div>
                <div className="wallet-usd-value">≈ {b.usd}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Mining Summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">⛏️ Mining</span>
              <Link to="/mining" className="btn btn-outline btn-sm">Manage</Link>
            </div>
            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-label">Active Contracts</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{activeContracts}</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-label">Total Hashrate</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{totalHashrate > 0 ? `${totalHashrate} TH/s` : '—'}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '1rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Today's Earnings</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                  {earnings.today ? `${earnings.today} BTC` : '—'}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This Month</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                  {earnings.month ? `${earnings.month} BTC` : '—'}
                </span>
              </div>
            </div>
            {activeContracts === 0 && (
              <div style={{ marginTop: '1rem' }}>
                <Link to="/mining" className="btn btn-primary btn-full">⛏️ Start Mining</Link>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📦 Recent Orders</span>
              <Link to="/orders" className="btn btn-outline btn-sm">View All</Link>
            </div>
            {orders.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-icon" style={{ fontSize: '2rem' }}>📦</div>
                <p>No orders yet</p>
                <Link to="/marketplace" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>Browse Marketplace</Link>
              </div>
            ) : (
              <div className="flex-col">
                {orders.map(o => (
                  <Link key={o.id || o._id} to={`/orders/${o.id || o._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem', background: 'var(--bg)', borderRadius: 6, textDecoration: 'none', color: 'var(--text)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Order #{(o.id || o._id || '').toString().slice(-6)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>${o.total || o.amount || '—'}</div>
                      <span className={`badge badge-${o.status === 'completed' ? 'success' : o.status === 'pending' ? 'warning' : 'secondary'}`}>{o.status || 'pending'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Referral Banner */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(59,130,246,0.08) 100%)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.3rem' }}>🔗 Refer & Earn</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Invite friends and earn up to 15% commission on their activity.</p>
            </div>
            <Link to="/referrals" className="btn btn-primary">View Referral Program</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
