import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CONVERSIONS = [
  { name: 'Free→Basic', rate: 18, color: '#3b82f6' },
  { name: 'Free→Advanced', rate: 4.2, color: '#8b5cf6' },
  { name: 'Free→Premium', rate: 1.9, color: '#ffd700' },
];

const DAILY_MEMBERS = Array.from({ length: 30 }, (_, i) => ({
  day: `Jan ${i + 1}`,
  members: 80 + Math.floor(Math.random() * 120 + i * 3),
}));

const PIE_DATA = [
  { name: 'Free', value: 76, color: '#888' },
  { name: 'Basic', value: 15, color: '#3b82f6' },
  { name: 'Advanced', value: 6, color: '#8b5cf6' },
  { name: 'Premium', value: 3, color: '#ffd700' },
];

const REVENUE_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `Jan ${i + 1}`,
  revenue: 5000 + Math.floor(Math.random() * 3000 + i * 80),
}));

const DATE_RANGES = ['7 Days', '30 Days', '90 Days', 'Custom'];

const KPI_DATA = {
  '7 Days': { mrr: '$267,349', arr: '$3,208,188', arpu: '$22.03', conversion: '24.1%', churn: '2.3%', ltv: '$264' },
  '30 Days': { mrr: '$267,349', arr: '$3,208,188', arpu: '$22.03', conversion: '24.1%', churn: '2.3%', ltv: '$264' },
  '90 Days': { mrr: '$271,100', arr: '$3,253,200', arpu: '$22.31', conversion: '25.0%', churn: '2.1%', ltv: '$272' },
  'Custom': { mrr: '$267,349', arr: '$3,208,188', arpu: '$22.03', conversion: '24.1%', churn: '2.3%', ltv: '$264' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '0.85rem' }}>
        <p style={{ marginBottom: '4px', color: '#a0a0b0' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#fff', fontWeight: '700' }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? `$${p.value.toLocaleString()}` : p.value}{p.name === 'rate' ? '%' : ''}</p>
        ))}
      </div>
    );
  }
  return null;
};

function AdminAnalytics() {
  const [activeRange, setActiveRange] = useState('30 Days');
  const kpi = KPI_DATA[activeRange];

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '80px 20px 60px', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>📊 Analytics Dashboard</h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Revenue, conversions, and platform KPIs</p>
        </div>

        {/* Date Range Picker */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {DATE_RANGES.map(r => (
            <button key={r} onClick={() => setActiveRange(r)} style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${activeRange === r ? '#f7931a' : 'rgba(255,255,255,0.15)'}`, background: activeRange === r ? 'rgba(247,147,26,0.15)' : 'rgba(255,255,255,0.04)', color: activeRange === r ? '#f7931a' : '#a0a0b0', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              {r}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'MRR', value: kpi.mrr, color: '#f7931a' },
            { label: 'ARR', value: kpi.arr, color: '#ffd700' },
            { label: 'ARPU', value: kpi.arpu, color: '#00d4aa' },
            { label: 'Conversion', value: kpi.conversion, color: '#3b82f6' },
            { label: 'Churn Rate', value: kpi.churn, color: '#ff4757' },
            { label: 'LTV', value: kpi.ltv, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...cardStyle, padding: '18px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: '900', color, marginBottom: '6px' }}>{value}</p>
              <p style={{ color: '#a0a0b0', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#a0a0b0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion Rates by Tier</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CONVERSIONS} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" stroke="#555" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" stroke="#555" tick={{ fill: '#888', fontSize: 11 }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                    {CONVERSIONS.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#a0a0b0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Members by Tier</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                    {PIE_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={v => [`${v}%`, 'Share']} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ color: '#a0a0b0', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#a0a0b0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily New Members</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DAILY_MEMBERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="#555" tick={{ fill: '#666', fontSize: 10 }} interval={4} />
                  <YAxis stroke="#555" tick={{ fill: '#666', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="members" stroke="#00d4aa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#a0a0b0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue Trend (Daily)</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REVENUE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="#555" tick={{ fill: '#666', fontSize: 10 }} interval={4} />
                  <YAxis stroke="#555" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#f7931a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminAnalytics;
