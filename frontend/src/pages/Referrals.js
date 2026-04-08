import React, { useState, useEffect } from 'react';
import { referral as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIERS = [
  { level: 1, name: 'Bronze', commission: '10%', req: '0 referrals', color: '#cd7f32' },
  { level: 2, name: 'Silver', commission: '12%', req: '5 referrals', color: '#c0c0c0' },
  { level: 3, name: 'Gold', commission: '15%', req: '20 referrals', color: '#ffd700' },
  { level: 4, name: 'Platinum', commission: '18%', req: '50 referrals', color: '#e5e4e2' },
];

const MOCK_STATS = {
  referralCode: 'JBLK-XY82K',
  totalReferred: 14,
  activeReferrals: 11,
  totalEarnings: 284.50,
  pendingEarnings: 42.00,
  tier: 'Silver',
};

const MOCK_REFERRALS = [
  { _id: 'r1', name: 'Mike Johnson', email: 'mike@example.com', joinedAt: '2024-01-10', status: 'active', earnings: 24.50 },
  { _id: 'r2', name: 'Sarah Lee', email: 'sarah@example.com', joinedAt: '2024-01-12', status: 'active', earnings: 38.00 },
  { _id: 'r3', name: 'Tom Brown', email: 'tom@example.com', joinedAt: '2024-01-15', status: 'inactive', earnings: 0 },
  { _id: 'r4', name: 'Emma Davis', email: 'emma@example.com', joinedAt: '2024-01-18', status: 'active', earnings: 15.20 },
];

export default function Referrals() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getStats().catch(() => ({ stats: MOCK_STATS })),
      api.getReferrals().catch(() => ({ referrals: MOCK_REFERRALS })),
    ]).then(([s, r]) => {
      setStats(s.stats || MOCK_STATS);
      setReferrals(r.referrals || MOCK_REFERRALS);
    }).finally(() => setLoading(false));
  }, []);

  const referralLink = `${window.location.origin}/register?ref=${stats?.referralCode || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(stats?.referralCode || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  const currentTierIdx = TIERS.findIndex(t => t.name === stats?.tier) || 0;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>🔗 Referral Program</h1>
          <p>Invite friends and earn commissions on their activity</p>
        </div>

        {/* Referral Link Card */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(59,130,246,0.05) 100%)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>📣 Your Referral Link</h3>

          <div className="form-group">
            <label>Referral Code</label>
            <div className="flex" style={{ gap: '0.5rem' }}>
              <div style={{ flex: 1, padding: '0.65rem 0.9rem', background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem', letterSpacing: '0.08em' }}>
                {stats?.referralCode || '—'}
              </div>
              <button className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={handleCopyCode}>
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Referral Link</label>
            <div className="flex" style={{ gap: '0.5rem' }}>
              <div style={{ flex: 1, padding: '0.65rem 0.9rem', background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {referralLink}
              </div>
              <button className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} onClick={handleCopyLink}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Referred', value: stats?.totalReferred || 0, icon: '👥', color: 'var(--secondary)' },
            { label: 'Active Referrals', value: stats?.activeReferrals || 0, icon: '✅', color: 'var(--success)' },
            { label: 'Total Earned', value: `$${(stats?.totalEarnings || 0).toFixed(2)}`, icon: '💰', color: 'var(--primary)' },
            { label: 'Pending Earnings', value: `$${(stats?.pendingEarnings || 0).toFixed(2)}`, icon: '⏳', color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex" style={{ marginBottom: '0.4rem' }}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span><span className="stat-label">{s.label}</span></div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tier Structure */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><span className="card-title">🏅 Reward Tiers</span></div>
          <div className="grid-4">
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                style={{
                  padding: '1.25rem',
                  borderRadius: 10,
                  border: `2px solid ${tier.color}`,
                  background: stats?.tier === tier.name ? `${tier.color}18` : 'var(--bg)',
                  textAlign: 'center',
                  opacity: i > currentTierIdx ? 0.5 : 1,
                  position: 'relative',
                }}
              >
                {stats?.tier === tier.name && (
                  <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: tier.color, color: '#0a0e1a', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.6rem', borderRadius: 20 }}>
                    CURRENT
                  </span>
                )}
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                  {tier.name === 'Bronze' ? '🥉' : tier.name === 'Silver' ? '🥈' : tier.name === 'Gold' ? '🥇' : '💎'}
                </div>
                <div style={{ fontWeight: 800, color: tier.color, marginBottom: '0.25rem' }}>{tier.name}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)' }}>{tier.commission}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>commission</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>Requires {tier.req}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👥 My Referrals ({referrals.length})</span>
          </div>
          {referrals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h3>No referrals yet</h3>
              <p>Share your referral link to start earning</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Joined</th><th>Status</th><th>Your Earnings</th></tr>
                </thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{r.email}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(r.joinedAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${r.status === 'active' ? 'success' : 'muted'}`}>{r.status}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: r.earnings > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        ${r.earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
