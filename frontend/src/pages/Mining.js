import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mining as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIERS = [
  { name: 'Entry', range: '50–100 TH/s', rate: '$0.30/TH/day', daily: '$5–$15/day', icon: '🔋', desc: 'Perfect for beginners. Low cost entry into cloud mining.' },
  { name: 'Professional', range: '200–500 TH/s', rate: '$0.25/TH/day', daily: '$30–$75/day', icon: '⚡', featured: true, desc: 'Best value for serious miners looking to grow their earnings.' },
  { name: 'Enterprise', range: '1,000–5,000 TH/s', rate: '$0.20/TH/day', daily: '$150–$375/day', icon: '🏭', desc: 'High-performance rigs for professional mining operations.' },
  { name: 'Industrial', range: '10,000+ TH/s', rate: '$0.15/TH/day', daily: '$1,500+/day', icon: '🌐', desc: 'Massive-scale industrial mining. Contact us for custom pricing.' },
];

const MOCK_RIGS = [
  { _id: 'rig1', name: 'Bitcoin Miner Alpha', hashrate: 110, type: 'ASIC', algorithm: 'SHA-256', location: 'Iceland', available: true, pricePerDay: 33.00 },
  { _id: 'rig2', name: 'ETH GPU Farm Beta', hashrate: 320, type: 'GPU', algorithm: 'Ethash', location: 'Canada', available: true, pricePerDay: 96.00 },
  { _id: 'rig3', name: 'Monero Miner Pro', hashrate: 85, type: 'CPU', algorithm: 'RandomX', location: 'Germany', available: true, pricePerDay: 25.50 },
  { _id: 'rig4', name: 'Industrial BTC Farm', hashrate: 1200, type: 'ASIC', algorithm: 'SHA-256', location: 'Texas', available: false, pricePerDay: 240.00 },
  { _id: 'rig5', name: 'GPU Mining Cluster', hashrate: 560, type: 'GPU', algorithm: 'Ethash', location: 'Norway', available: true, pricePerDay: 140.00 },
  { _id: 'rig6', name: 'Litecoin Miner Delta', hashrate: 200, type: 'ASIC', algorithm: 'Scrypt', location: 'Singapore', available: true, pricePerDay: 50.00 },
];

export default function Mining() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [rigs, setRigs] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roiHashrate, setRoiHashrate] = useState(100);
  const [roiDuration, setRoiDuration] = useState(30);

  useEffect(() => {
    const calls = [api.getRigs().catch(() => ({ rigs: MOCK_RIGS }))];
    if (isAuthenticated) calls.push(api.getContracts().catch(() => ({ contracts: [] })));

    Promise.all(calls).then(([r, c]) => {
      setRigs(r.rigs || MOCK_RIGS);
      if (c) setContracts(c.contracts || []);
    }).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const roiEstimate = (roiHashrate * 0.00000025 * roiDuration).toFixed(6);
  const roiUsd = (roiHashrate * 0.00000025 * roiDuration * 65000).toFixed(2);

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1>☁️ <span>Cloud Mining</span> Rigs</h1>
          <p>Rent industrial-grade hashing power from $5/day. Start earning Bitcoin instantly — no hardware required.</p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-outline btn-lg">📊 My Contracts</Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">🚀 Start Mining Free</Link>
            )}
          </div>
        </div>
      </div>

      <div className="page-wrapper" style={{ paddingTop: '2rem' }}>
        <div className="container">
          {/* Tier Cards */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Mining Plans</h2>
            <p className="section-sub" style={{ textAlign: 'center', marginBottom: '2rem' }}>Choose the right hashrate for your investment goals</p>
            <div className="grid-4">
              {TIERS.map(tier => (
                <div key={tier.name} className={`tier-card ${tier.featured ? 'featured' : ''}`}>
                  {tier.featured && <span className="tier-badge">Most Popular</span>}
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tier.icon}</div>
                  <div className="tier-name">{tier.name}</div>
                  <div className="tier-hashrate">{tier.range}</div>
                  <div className="tier-price">{tier.rate} · {tier.daily}</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{tier.desc}</p>
                  <ul className="tier-features">
                    <li>24/7 monitoring</li>
                    <li>Daily payouts</li>
                    <li>Multi-pool support</li>
                    <li>Real-time dashboard</li>
                  </ul>
                  <button className={`btn btn-full btn-sm ${tier.featured ? 'btn-primary' : 'btn-outline'}`} onClick={() => navigate(isAuthenticated ? '/mining#rigs' : '/register')}>
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ROI Calculator */}
          <div className="card" style={{ marginBottom: '3rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(59,130,246,0.04) 100%)', borderColor: 'rgba(245,158,11,0.25)' }}>
            <div className="card-header"><span className="card-title">🧮 ROI Calculator</span></div>
            <div className="grid-2">
              <div>
                <div className="form-group">
                  <label>Hashrate (TH/s)</label>
                  <input type="number" className="form-control" value={roiHashrate} onChange={e => setRoiHashrate(Number(e.target.value))} min={1} max={50000} />
                </div>
                <div className="form-group">
                  <label>Duration (days)</label>
                  <select className="form-control" value={roiDuration} onChange={e => setRoiDuration(Number(e.target.value))}>
                    <option value={30}>1 Month (30 days)</option>
                    <option value={90}>3 Months (90 days)</option>
                    <option value={180}>6 Months (180 days)</option>
                    <option value={365}>1 Year (365 days)</option>
                    <option value={730}>2 Years (730 days)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                <div className="stat-card" style={{ background: 'var(--bg-card2)' }}>
                  <div className="stat-label">Estimated BTC Earnings</div>
                  <div className="stat-value" style={{ color: 'var(--primary)' }}>{roiEstimate} BTC</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card2)' }}>
                  <div className="stat-label">Estimated USD Value</div>
                  <div className="stat-value" style={{ color: 'var(--success)' }}>${roiUsd}</div>
                </div>
              </div>
            </div>
            <div className="alert alert-warning" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              ⚠️ Estimates are based on current network difficulty and BTC price. Actual earnings may vary.
            </div>
          </div>

          {/* Available Rigs */}
          <div id="rigs" style={{ marginBottom: '3rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2 className="section-title">Available Rigs</h2>
                <p className="section-sub">Browse and rent available mining hardware</p>
              </div>
            </div>

            {loading ? (
              <div className="loading-center"><div className="spinner spinner-lg" /></div>
            ) : (
              <div className="grid-3">
                {rigs.map(rig => (
                  <div key={rig._id} className="card" style={{ opacity: rig.available ? 1 : 0.6 }}>
                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                      <span className="badge badge-muted">{rig.type}</span>
                      <span className={`badge ${rig.available ? 'badge-success' : 'badge-danger'}`}>
                        {rig.available ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>{rig.name}</h3>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      {rig.hashrate} TH/s
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {rig.algorithm} · 📍 {rig.location}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--success)', marginBottom: '1rem' }}>
                      ${rig.pricePerDay}/day
                    </div>
                    <Link to={`/mining/${rig._id}`} className={`btn btn-full btn-sm ${rig.available ? 'btn-primary' : 'btn-outline'}`}>
                      {rig.available ? '⛏️ Rent This Rig' : 'View Details'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Contracts */}
          {isAuthenticated && (
            <div>
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="section-title">My Mining Contracts</h2>
                  <p className="section-sub">Your active and past contracts</p>
                </div>
              </div>

              {contracts.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-icon">⛏️</div>
                    <h3>No active contracts</h3>
                    <p>Rent a rig above to start earning</p>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr><th>Rig</th><th>Hashrate</th><th>Duration</th><th>Start</th><th>Earnings</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {contracts.map(c => (
                          <tr key={c._id}>
                            <td style={{ fontWeight: 600 }}>{c.rigName || 'Mining Rig'}</td>
                            <td>{c.hashrate} TH/s</td>
                            <td>{c.durationDays} days</td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(c.startDate || c.createdAt).toLocaleDateString()}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 700 }}>{c.totalEarnings || '0.000000'} BTC</td>
                            <td><span className={`badge badge-${c.status === 'active' ? 'success' : 'muted'}`}>{c.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
