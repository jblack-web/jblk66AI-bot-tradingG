import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOCK_STATS = [
  { label: 'Total Users', value: '12,840', icon: '👥', change: '+4.2%', up: true },
  { label: 'Active Mining Rigs', value: '3,291', icon: '⛏️', change: '+11.8%', up: true },
  { label: 'Daily Volume', value: '$842,000', icon: '📈', change: '+7.6%', up: true },
  { label: 'Products Available', value: '1,420', icon: '🛒', change: '+2.1%', up: true },
];

const FEATURES = [
  { icon: '📈', title: 'Crypto Trading', desc: 'Trade BTC, ETH, LTC and 50+ cryptocurrencies with real-time charts and advanced tools.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Buy and sell mining equipment, hardware, educational courses and software licenses.' },
  { icon: '☁️', title: 'Cloud Mining', desc: 'Rent industrial-grade mining rigs from $5/day. Choose your hashrate and start earning instantly.' },
  { icon: '💳', title: 'Multi-Currency Wallet', desc: 'Store, send and receive BTC, ETH, USDT, USDC and fiat — all in one secure wallet.' },
  { icon: '🔗', title: 'Referral Program', desc: 'Earn up to 15% commission by referring friends. Multiple reward tiers available.' },
  { icon: '🏪', title: 'Become a Seller', desc: 'List your products in our marketplace and reach thousands of crypto enthusiasts worldwide.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [stats] = useState(MOCK_STATS);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>All-in-One <span>Trading</span> &<br />Mining Platform</h1>
          <p>Trade crypto, rent cloud mining rigs, browse the marketplace, and manage your multi-currency wallet — all in one place.</p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">📊 Dashboard</Link>
                <Link to="/mining" className="btn btn-secondary btn-lg">⛏️ Start Mining</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">🚀 Get Started Free</Link>
                <Link to="/marketplace" className="btn btn-outline btn-lg">🛒 Browse Marketplace</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ paddingTop: '2.5rem', paddingBottom: '1.5rem', background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-4">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="flex" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change} this month</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-sub">A complete ecosystem for crypto traders, miners, buyers and sellers.</p>
          </div>
          <div className="grid-3">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mining CTA */}
      <section className="section" style={{ background: 'rgba(245,158,11,0.04)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Start Cloud Mining Today</h2>
          <p className="section-sub">Rent hashing power starting at 50 TH/s. No hardware needed.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <div className="card" style={{ minWidth: 200 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>50–100 TH/s</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Entry Tier · from $5/day</div>
            </div>
            <div className="card" style={{ minWidth: 200, borderColor: 'var(--primary)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>200–500 TH/s</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Pro Tier · from $30/day</div>
            </div>
            <div className="card" style={{ minWidth: 200 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>1000+ TH/s</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Enterprise · from $150/day</div>
            </div>
          </div>
          <Link to="/mining" className="btn btn-primary btn-lg" style={{ marginTop: '2rem' }}>⛏️ View All Mining Plans</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          <p style={{ marginBottom: '0.5rem' }}>⚡ <strong style={{ color: 'var(--primary)' }}>jblk66AI</strong> — All-in-One Trading & Mining Platform</p>
          <p>© {new Date().getFullYear()} jblk66AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
