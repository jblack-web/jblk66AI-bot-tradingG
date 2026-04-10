import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, tierAPI } from '../utils/api';

const TIER_META = {
  free: { label: 'Free', color: '#64748B', icon: '🆓' },
  basic: { label: 'Basic', color: '#3B82F6', icon: '🔵' },
  advanced: { label: 'Advanced', color: '#8B5CF6', icon: '🟣' },
  premium: { label: 'Premium', color: '#F59E0B', icon: '⭐' },
};

function TierBadge({ tier }) {
  const meta = TIER_META[tier] || { label: tier, color: '#64748B', icon: '❔' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: meta.color + '22', color: meta.color,
      border: `1px solid ${meta.color}44`,
      borderRadius: 6, padding: '2px 10px',
      fontSize: 12, fontWeight: 600,
    }}>
      {meta.icon} {meta.label}
    </span>
  );
}

function Alert({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
      {msg.text}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
    </div>
  );
}

// ─── Upgrade User Modal ──────────────────────────────────────────────────────
function UpgradeModal({ user, tiers, onSave, onClose }) {
  const [form, setForm] = useState({
    currentTier: user.currentTier || 'free',
    expiryDays: 30,
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(user._id, form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>⭐ Upgrade Membership</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
          <div style={{ fontWeight: 700 }}>{user.username}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</div>
          <div style={{ marginTop: 8 }}>Current: <TierBadge tier={user.currentTier} /></div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">New Membership Tier</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.entries(TIER_META).map(([key, meta]) => (
                <label
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: form.currentTier === key ? meta.color + '22' : 'var(--bg-secondary)',
                    border: `2px solid ${form.currentTier === key ? meta.color : 'var(--border-color)'}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="tier" value={key} checked={form.currentTier === key} onChange={() => setForm(f => ({ ...f, currentTier: key }))} style={{ display: 'none' }} />
                  <span style={{ fontSize: 20 }}>{meta.icon}</span>
                  <span style={{ fontWeight: 600, color: form.currentTier === key ? meta.color : 'var(--text-primary)' }}>{meta.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Duration (days)</label>
            <select className="form-input" value={form.expiryDays} onChange={e => setForm(f => ({ ...f, expiryDays: +e.target.value }))}>
              <option value={7}>7 days (trial)</option>
              <option value={30}>30 days (1 month)</option>
              <option value={90}>90 days (3 months)</option>
              <option value={180}>180 days (6 months)</option>
              <option value={365}>365 days (1 year)</option>
              <option value={0}>Lifetime</option>
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Admin Note (optional)</label>
            <input className="form-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. Promotional upgrade, VIP grant..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Upgrading…' : '⭐ Apply Upgrade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main MembershipUpgradePanel ─────────────────────────────────────────────
export default function MembershipUpgradePanel() {
  const [users, setUsers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [upgradeUser, setUpgradeUser] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filterTier) params.tier = filterTier;
      const [usersRes, tiersRes] = await Promise.all([
        adminAPI.getUsers(params),
        tierAPI.getAll(),
      ]);
      setUsers(usersRes.data.users || []);
      setTotal(usersRes.data.total || 0);
      setTiers(tiersRes.data.tiers || []);
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterTier]);

  useEffect(() => { load(); }, [load]);

  const handleUpgrade = async (userId, form) => {
    try {
      const updates = { currentTier: form.currentTier };
      if (form.expiryDays > 0) {
        const exp = new Date();
        exp.setDate(exp.getDate() + form.expiryDays);
        updates.tierExpiresAt = exp.toISOString();
      } else {
        updates.tierExpiresAt = null;
      }
      await adminAPI.updateUser(userId, updates);
      showMsg('success', `Membership upgraded to ${TIER_META[form.currentTier]?.label || form.currentTier} successfully.`);
      setUpgradeUser(null);
      load();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Upgrade failed.');
    }
  };

  // Tier distribution from current users
  const tierCounts = Object.keys(TIER_META).reduce((acc, t) => {
    acc[t] = users.filter(u => u.currentTier === t).length;
    return acc;
  }, {});

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {upgradeUser && (
        <UpgradeModal
          user={upgradeUser}
          tiers={tiers}
          onSave={handleUpgrade}
          onClose={() => setUpgradeUser(null)}
        />
      )}

      <Alert msg={msg} onClose={() => setMsg(null)} />

      {/* Tier Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {Object.entries(TIER_META).map(([key, meta]) => (
          <div key={key} className="stat-card" style={{ cursor: 'pointer', border: filterTier === key ? `2px solid ${meta.color}` : '1px solid var(--border-color)' }} onClick={() => setFilterTier(filterTier === key ? '' : key)}>
            <div style={{ fontSize: 28 }}>{meta.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: meta.color }}>{tierCounts[key] || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{meta.label} Members</div>
          </div>
        ))}
      </div>

      {/* Tiers description */}
      {tiers.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px' }}>📦 Available Membership Plans</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {tiers.map(tier => {
              const meta = TIER_META[tier.slug] || {};
              return (
                <div key={tier._id} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '16px', borderLeft: `4px solid ${meta.color || '#64748B'}` }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: meta.color }}>{meta.icon} {tier.displayName || tier.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>${tier.monthlyPrice}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span></div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {tier.maxDailyTrades} trades/day · {tier.maxLeverage}x leverage
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280, flex: 1 }}
          placeholder="🔍 Search users..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="form-input" style={{ maxWidth: 180 }} value={filterTier} onChange={e => { setFilterTier(e.target.value); setPage(1); }}>
          <option value="">All Tiers</option>
          {Object.entries(TIER_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterTier(''); setPage(1); }}>Clear</button>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['User', 'Email', 'Current Tier', 'Tier Expires', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.map((user, i) => (
              <tr key={user._id} style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.role}</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</td>
                <td style={{ padding: '14px 16px' }}><TierBadge tier={user.currentTier} /></td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                  {user.tierExpiresAt
                    ? new Date(user.tierExpiresAt) < new Date()
                      ? <span style={{ color: '#EF4444' }}>Expired {new Date(user.tierExpiresAt).toLocaleDateString()}</span>
                      : new Date(user.tierExpiresAt).toLocaleDateString()
                    : user.currentTier === 'free' ? '—' : 'Lifetime'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setUpgradeUser(user)}>
                    ⭐ Upgrade
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '6px 12px', fontSize: 14, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
