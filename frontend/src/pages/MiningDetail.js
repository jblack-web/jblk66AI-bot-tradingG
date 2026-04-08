import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mining as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DURATION_OPTIONS = [
  { value: 30, label: '1 Month', discount: 0 },
  { value: 90, label: '3 Months', discount: 5 },
  { value: 180, label: '6 Months', discount: 10 },
  { value: 365, label: '1 Year', discount: 15 },
  { value: 730, label: '2 Years', discount: 20 },
  { value: 1825, label: '5 Years', discount: 25 },
];

const POOLS = ['Slush Pool', 'F2Pool', 'Antpool', 'ViaBTC', 'Poolin', 'BTC.com'];

const MOCK_RIG = {
  _id: 'rig1',
  name: 'Bitcoin Miner Alpha Pro',
  hashrate: 110,
  type: 'ASIC',
  algorithm: 'SHA-256',
  location: 'Iceland',
  available: true,
  pricePerDay: 33.00,
  powerConsumption: '3245W',
  uptime: '99.8%',
  coin: 'Bitcoin (BTC)',
  description: 'Industrial-grade ASIC miner powered by the latest Antminer hardware. Located in our Iceland data center with 100% renewable energy.',
};

export default function MiningDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [rig, setRig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renting, setRenting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duration, setDuration] = useState(30);
  const [pool, setPool] = useState(POOLS[0]);

  useEffect(() => {
    api.getRig(id)
      .then(data => setRig(data.rig || data))
      .catch(() => setRig({ ...MOCK_RIG, _id: id }))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedDuration = DURATION_OPTIONS.find(d => d.value === duration) || DURATION_OPTIONS[0];
  const baseTotal = rig ? rig.pricePerDay * duration : 0;
  const discountAmt = baseTotal * (selectedDuration.discount / 100);
  const total = baseTotal - discountAmt;
  const btcEarnings = rig ? (rig.hashrate * 0.00000025 * duration).toFixed(6) : 0;
  const usdEarnings = (btcEarnings * 65000).toFixed(2);

  const handleRent = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setRenting(true);
    setError('');
    try {
      await api.rentRig({ rigId: id, durationDays: duration, pool });
      setSuccess(`✓ Contract created! Your ${selectedDuration.label} mining contract is now active.`);
    } catch (err) {
      setError(err.message || 'Failed to create contract. Please check your wallet balance.');
    } finally {
      setRenting(false);
    }
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;
  if (!rig) return <div className="page-wrapper"><div className="container"><div className="empty-state"><h3>Rig not found</h3></div></div></div>;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/mining">Mining</Link>
          <span className="sep">›</span>
          <span className="current">{rig.name}</span>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left: Rig Details */}
          <div className="flex-col">
            <div className="card">
              <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span className="badge badge-muted">{rig.type}</span>
                <span className={`badge ${rig.available ? 'badge-success' : 'badge-danger'}`}>
                  {rig.available ? '● Available' : '○ Unavailable'}
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{rig.name}</h1>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                {rig.hashrate} TH/s
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                📍 {rig.location} · {rig.algorithm}
              </div>
              {rig.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{rig.description}</p>}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">📋 Specifications</span></div>
              <table className="table">
                <tbody>
                  {[
                    ['Hashrate', `${rig.hashrate} TH/s`],
                    ['Algorithm', rig.algorithm],
                    ['Hardware Type', rig.type],
                    ['Mining Coin', rig.coin || 'Bitcoin (BTC)'],
                    ['Power Consumption', rig.powerConsumption || '—'],
                    ['Uptime', rig.uptime || '99.5%'],
                    ['Location', rig.location],
                    ['Daily Rate', `$${rig.pricePerDay}/day`],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{k}</td>
                      <td style={{ fontWeight: 500 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Rental Form */}
          <div className="card">
            <div className="card-header"><span className="card-title">⛏️ Rent This Rig</span></div>

            {error && <div className="alert alert-error">⚠️ {error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {!success && (
              <>
                <div className="form-group">
                  <label>Contract Duration</label>
                  <div className="flex-col" style={{ gap: '0.4rem' }}>
                    {DURATION_OPTIONS.map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 8, border: `1px solid ${duration === opt.value ? 'var(--primary)' : 'var(--border)'}`, background: duration === opt.value ? 'rgba(245,158,11,0.08)' : 'var(--bg)', cursor: 'pointer' }}>
                        <input type="radio" checked={duration === opt.value} onChange={() => setDuration(opt.value)} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700 }}>{opt.label}</span>
                          {opt.discount > 0 && <span style={{ marginLeft: '0.5rem', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700 }}>−{opt.discount}%</span>}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          ${(rig.pricePerDay * opt.value * (1 - opt.discount / 100)).toFixed(0)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mining Pool</label>
                  <select className="form-control" value={pool} onChange={e => setPool(e.target.value)}>
                    {POOLS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Earnings Estimate */}
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Estimated Earnings</div>
                  <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>BTC Earnings</div>
                      <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{btcEarnings} BTC</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>USD Value</div>
                      <div style={{ fontWeight: 800, color: 'var(--success)' }}>${usdEarnings}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Daily Rate</div>
                      <div style={{ fontWeight: 700 }}>${rig.pricePerDay}/day</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Total Cost</div>
                      <div style={{ fontWeight: 800 }}>${total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-between" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span style={{ fontWeight: 700 }}>Total Payment</span>
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>${total.toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleRent}
                  disabled={renting || !rig.available}
                >
                  {renting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating Contract...</> : rig.available ? '⛏️ Rent Now' : 'Rig Unavailable'}
                </button>

                {!isAuthenticated && (
                  <div className="alert alert-info" style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
                    💡 <Link to="/login" style={{ color: 'var(--secondary)' }}>Login</Link> or <Link to="/register" style={{ color: 'var(--secondary)' }}>register</Link> to rent this rig.
                  </div>
                )}
              </>
            )}

            {success && (
              <div className="flex-col">
                <Link to="/dashboard" className="btn btn-primary btn-full">📊 View My Contracts</Link>
                <Link to="/mining" className="btn btn-outline btn-full">⛏️ Rent Another Rig</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
