import React from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const USER_GROWTH = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  users: 48000 + Math.floor(Math.random() * 400 + i * 70),
}));

const REVENUE_BY_TIER = [
  { tier: 'Free', revenue: 0, fill: '#888' },
  { tier: 'Basic', revenue: 24000, fill: '#3b82f6' },
  { tier: 'Advanced', revenue: 87000, fill: '#8b5cf6' },
  { tier: 'Premium', revenue: 156000, fill: '#ffd700' },
];

const ACTIVITY = [
  { msg: 'User john@example.com upgraded to Premium', time: '2 min ago', icon: '⬆️' },
  { msg: 'New free registration: sarah@example.com', time: '5 min ago', icon: '🆕' },
  { msg: 'User mike@example.com upgraded to Advanced', time: '11 min ago', icon: '⬆️' },
  { msg: '3 trials expired — renewal emails sent', time: '18 min ago', icon: '⏰' },
  { msg: 'New free registration: alex@example.com', time: '24 min ago', icon: '🆕' },
];

function AdminPanel() {
  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '80px 20px 60px', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>⚙️ Admin Panel</h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Platform overview and management</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Users', value: '50,247', color: '#f7931a', icon: '👥' },
            { label: 'Free Members', value: '38,120', color: '#888', icon: '🆓' },
            { label: 'Paid Members', value: '12,127', color: '#00d4aa', icon: '💎' },
            { label: "Today's Revenue", value: '$4,892', color: '#ffd700', icon: '💰' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.6rem' }}>{icon}</span>
              </div>
              <p style={{ fontSize: '1.9rem', fontWeight: '900', color, marginBottom: '4px' }}>{value}</p>
              <p style={{ color: '#a0a0b0', fontSize: '0.82rem', fontWeight: '500' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#a0a0b0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User Growth (30 Days)</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={USER_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="#555" tick={{ fill: '#666', fontSize: 10 }} interval={4} />
                  <YAxis stroke="#555" tick={{ fill: '#666', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="users" stroke="#f7931a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#a0a0b0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue by Tier</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_BY_TIER}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="tier" stroke="#555" tick={{ fill: '#666', fontSize: 11 }} />
                  <YAxis stroke="#555" tick={{ fill: '#666', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {REVENUE_BY_TIER.map((entry, index) => (
                      <rect key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Nav */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: '👥 Manage Members', desc: 'View, filter, and manage all users', link: '/admin/members', color: '#3b82f6' },
            { label: '📊 Analytics', desc: 'Revenue, conversions, and KPIs', link: '/admin/analytics', color: '#8b5cf6' },
            { label: '🏷️ Promotions', desc: 'Create and manage promo codes', link: '/admin/promotions', color: '#f7931a' },
          ].map(({ label, desc, link, color }) => (
            <Link to={link} key={link} style={{ textDecoration: 'none' }}>
              <div style={{ ...cardStyle, border: `1px solid ${color}30`, cursor: 'pointer', transition: 'border-color 0.2s ease, transform 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}80`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <h3 style={{ fontWeight: '700', marginBottom: '8px', color }}>{label}</h3>
                <p style={{ color: '#a0a0b0', fontSize: '0.85rem' }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Activity + Alerts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>📡 Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {ACTIVITY.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.88rem', color: '#d0d0e0', marginBottom: '2px' }}>{item.msg}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ ...cardStyle, background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ff4757', marginBottom: '10px' }}>⚠️ Alerts</h3>
              <p style={{ fontSize: '0.88rem', color: '#d0d0e0', marginBottom: '10px', lineHeight: '1.5' }}>
                142 free trials expiring in 24 hours.
              </p>
              <button style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
                Send Email Campaign
              </button>
            </div>
            <div style={{ ...cardStyle }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px' }}>📈 Quick Stats</h3>
              {[['Avg. Session', '8m 32s'], ['Bounce Rate', '24.3%'], ['Conversion', '24.1%']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem' }}>
                  <span style={{ color: '#a0a0b0' }}>{l}</span>
                  <span style={{ fontWeight: '700' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminPanel;
