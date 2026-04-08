import React, { useState, useEffect } from 'react';
import { adminAPI, tierAPI } from '../utils/api';

export default function TiersPanel() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    tierAPI.getAll().then(res => setTiers(res.data.tiers)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const tierColors = { free: '#64748B', basic: '#3B82F6', advanced: '#8B5CF6', premium: '#F59E0B' };

  return (
    <div>
      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}<button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button></div>}
      <div className="tier-cards">
        {tiers.map(tier => (
          <div key={tier._id} className={`tier-card ${tier.isFeatured ? 'featured' : ''}`} style={{ borderColor: tierColors[tier.slug] || 'var(--border-color)' }}>
            {tier.isFeatured && <div className="featured-badge">POPULAR</div>}
            <div style={{ fontSize: 32, marginBottom: 8 }}>{tier.slug === 'free' ? '🆓' : tier.slug === 'basic' ? '🔵' : tier.slug === 'advanced' ? '🟣' : '⭐'}</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: tierColors[tier.slug] }}>{tier.displayName || tier.name}</div>
            <div className="tier-price">${tier.monthlyPrice}<span>/mo</span></div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>${tier.yearlyPrice}/year (save {Math.round((1 - tier.yearlyPrice / (tier.monthlyPrice * 12)) * 100)}%)</div>
            <ul className="tier-features">
              {(tier.benefits || []).slice(0, 6).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <div>📈 {tier.maxDailyTrades} daily trades</div>
              <div>💹 {tier.maxLeverage}x max leverage</div>
              <div>🔄 {tier.automatedTradesPerDay}x automated/day</div>
            </div>
          </div>
        ))}
        {tiers.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 48, gridColumn: '1/-1' }}>
            <p style={{ color: 'var(--text-muted)' }}>No tiers found. Run the seeder to populate tier packages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
