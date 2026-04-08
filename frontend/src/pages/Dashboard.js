import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_EARNINGS_CHART = [
  { day: 'Mon', earnings: 1.23 },
  { day: 'Tue', earnings: 1.87 },
  { day: 'Wed', earnings: 2.14 },
  { day: 'Thu', earnings: 1.56 },
  { day: 'Fri', earnings: 2.31 },
  { day: 'Sat', earnings: 1.98 },
  { day: 'Sun', earnings: 2.14 },
];

const MOCK_TRANSACTIONS = [
  { date: '2024-01-15 14:23', type: 'Mining Reward', amount: '+$2.14', status: 'Confirmed' },
  { date: '2024-01-15 09:00', type: 'Mining Reward', amount: '+$1.89', status: 'Confirmed' },
  { date: '2024-01-14 22:15', type: 'Referral Bonus', amount: '+$5.00', status: 'Confirmed' },
  { date: '2024-01-14 09:00', type: 'Mining Reward', amount: '+$2.31', status: 'Confirmed' },
  { date: '2024-01-13 09:00', type: 'Mining Reward', amount: '+$1.56', status: 'Confirmed' },
];

const TIER_COLORS = { free: '#888', basic: '#3b82f6', advanced: '#8b5cf6', premium: '#ffd700' };
const TIER_LABELS = { free: 'FREE', basic: 'BASIC', advanced: 'ADVANCED', premium: 'PREMIUM' };

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      if (stored) {
        setUser(stored);
      } else {
        setUser({ firstName: 'Miner', email: 'miner@example.com', tier: 'free', id: 'USER123' });
      }
    } catch {
      setUser({ firstName: 'Miner', email: 'miner@example.com', tier: 'free', id: 'USER123' });
    }
  }, []);

  const handleCopyReferral = () => {
    const link = `https://jblk66ai.com/ref/${user?.id || 'USER123'}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const tier = user?.tier || 'free';
  const tierColor = TIER_COLORS[tier] || '#888';
  const tierLabel = TIER_LABELS[tier] || 'FREE';
  const isPremium = tier === 'premium';
  const referralLink = `https://jblk66ai.com/ref/${user?.id || 'USER123'}`;

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  };

  const statCard = (label, value, sub, iconColor) => (
    <div style={cardStyle}>
      <p style={{ color: '#a0a0b0', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>{label}</p>
      <p style={{ fontSize: '1.8rem', fontWeight: '800', color: iconColor || '#fff', marginBottom: '4px' }}>{value}</p>
      {sub && <p style={{ color: '#666', fontSize: '0.8rem' }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '80px 20px 60px', color: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
              Welcome back, {user?.firstName || 'Miner'}! 👋
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: `${tierColor}22`, border: `1px solid ${tierColor}66`, color: tierColor, padding: '3px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '1px' }}>
                {tierLabel}
              </span>
              <span style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>{user?.email}</span>
            </div>
          </div>
          <Link to="/trading" style={{ background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: '700', textDecoration: 'none' }}>
            📈 Open Trading
          </Link>
        </div>

        {/* Trial Banner */}
        {tier === 'free' && (
          <div style={{ background: 'rgba(247,147,26,0.1)', border: '1px solid rgba(247,147,26,0.3)', borderRadius: '12px', padding: '14px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ color: '#f7931a', fontWeight: '600', fontSize: '0.92rem' }}>⏰ 5 days left in your FREE trial</span>
            <button
              onClick={() => navigate('/#pricing')}
              style={{ background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', border: 'none', cursor: 'pointer' }}
            >
              UPGRADE NOW →
            </button>
          </div>
        )}

        {/* Mining Stats */}
        <div style={{ ...cardStyle, marginBottom: '24px', border: '1px solid rgba(0,212,170,0.2)', background: 'rgba(0,212,170,0.04)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px', color: '#00d4aa' }}>⛏️ Mining Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Hash Rate', value: '10 TH/s', sub: '', color: '#00d4aa' },
              { label: 'Daily Earnings', value: '$1.00–$3.00', sub: 'Est. per day', color: '#f7931a' },
              { label: 'Mining Status', value: '🟢 Active', sub: 'Running now', color: '#00d4aa' },
              { label: 'Mining Pool', value: 'Global Pool #1', sub: '0.3% fee', color: '#a0a0b0' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ borderRight: '1px solid rgba(255,255,255,0.07)', paddingRight: '20px', lastChild: { borderRight: 'none' } }}>
                <p style={{ color: '#a0a0b0', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color, marginBottom: '3px' }}>{value}</p>
                <p style={{ color: '#666', fontSize: '0.78rem' }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {statCard('Total Earned', '$47.23', 'All time', '#00d4aa')}
          {statCard("Today's Earnings", '$2.14', 'Since 00:00 UTC', '#f7931a')}
          {statCard('Mining Uptime', '99.8%', 'Last 30 days', '#8b5cf6')}
          {statCard('Referrals', '3', '$15 earned', '#ffd700')}
        </div>

        {/* Earnings Chart */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>📊 7-Day Earnings</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_EARNINGS_CHART}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`$${v}`, 'Earnings']} />
                <Area type="monotone" dataKey="earnings" stroke="#8b5cf6" strokeWidth={2} fill="url(#earningsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upgrade CTA */}
        {!isPremium && (
          <div style={{ ...cardStyle, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>🚀 Upgrade to Advanced — 20x more mining power</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {['200 TH/s hash rate', '$30–$75/day earnings', 'API access', 'Priority support'].map(b => (
                    <span key={b} style={{ color: '#a0a0b0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#00d4aa' }}>✓</span> {b}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate('/#pricing')}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                UPGRADE NOW
              </button>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>🧾 Recent Transactions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr>
                  {['Date', 'Type', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ color: '#a0a0b0', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TRANSACTIONS.map((tx, i) => (
                  <tr key={i}>
                    <td style={{ padding: '12px', color: '#888', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{tx.date}</td>
                    <td style={{ padding: '12px', color: tx.type === 'Mining Reward' ? '#00d4aa' : '#ffd700', fontSize: '0.88rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{tx.type}</td>
                    <td style={{ padding: '12px', color: '#00d4aa', fontWeight: '700', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{tx.amount}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Referral */}
        <div style={{ ...cardStyle }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>🔗 Your Referral Program</h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              readOnly
              value={referralLink}
              style={{ flex: 1, minWidth: '200px', padding: '11px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#a0a0b0', fontSize: '0.88rem', cursor: 'text' }}
            />
            <button
              onClick={handleCopyReferral}
              style={{ background: copied ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.08)', color: copied ? '#00d4aa' : '#fff', border: `1px solid ${copied ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.15)'}`, padding: '11px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}
            >
              {copied ? '✓ Copied!' : '📋 COPY LINK'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total Referrals', value: '3' },
              { label: 'Referral Earnings', value: '$15.00' },
              { label: 'Commission Rate', value: '10%' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <p style={{ color: '#ffd700', fontSize: '1.3rem', fontWeight: '800' }}>{value}</p>
                <p style={{ color: '#a0a0b0', fontSize: '0.78rem', marginTop: '4px' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
