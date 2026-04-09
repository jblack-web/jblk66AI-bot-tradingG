import React, { useState, useEffect, useCallback } from 'react';
import { stakingAdminAPI } from '../utils/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BTC_ICON = '₿';

function fmt(n, dec = 2) {
  return (n || 0).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtBtc(n) {
  return `${BTC_ICON} ${fmt(n, 6)}`;
}

function fmtUsd(n) {
  return `$${fmt(n)}`;
}

function riskBadge(level) {
  const map = {
    'Very Low': 'badge-green',
    'Low': 'badge-blue',
    'Low-Medium': 'badge-blue',
    'Medium': 'badge-yellow',
    'High': 'badge-red',
  };
  return <span className={`badge ${map[level] || 'badge-gray'}`}>{level}</span>;
}

function statusBadge(s) {
  const map = { Active: 'badge-green', Completed: 'badge-blue', Withdrawn: 'badge-gray', Paused: 'badge-yellow' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData] = useState(null);
  const [rev, setRev] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([stakingAdminAPI.getDashboard(), stakingAdminAPI.getRevenue()])
      .then(([d, r]) => { setData(d.data.data); setRev(r.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon">{BTC_ICON}</div>
          <div className="stat-value">{fmtBtc(data?.totalTVL)}</div>
          <div className="stat-label">Total Value Locked</div>
          <div className="stat-change up">{fmtUsd(data?.totalTVLUSD)} USD</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{data?.activeStakers?.toLocaleString() || 0}</div>
          <div className="stat-label">Active Stakers</div>
          <div className="stat-change up">↑ {data?.newStakersToday || 0} today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{fmt(data?.avgAPY)}%</div>
          <div className="stat-label">Avg APY</div>
          <div className="stat-change up">Across all pools</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-value">{fmtBtc(data?.totalDistributed)}</div>
          <div className="stat-label">Rewards Paid</div>
          <div className="stat-change" style={{ color: 'var(--accent-yellow)' }}>
            ⏳ Pending: {fmtBtc(data?.pendingPayouts)}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">🏊 Pool Breakdown</div>
          {data?.poolBreakdown?.length ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pool</th>
                    <th>TVL</th>
                    <th>Participants</th>
                    <th>APY</th>
                  </tr>
                </thead>
                <tbody>
                  {data.poolBreakdown.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                      <td style={{ fontSize: 12 }}>{fmtBtc(p.tvl)}</td>
                      <td>{p.participants}</td>
                      <td style={{ color: 'var(--accent-green)' }}>{fmt(p.apy)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No pools yet.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">💰 Revenue Overview</div>
          {rev ? (
            <div>
              {[
                { label: 'Daily Revenue', btc: rev.dailyRevenue, usd: rev.dailyRevenueUSD },
                { label: 'Monthly Revenue', btc: rev.monthlyRevenue, usd: rev.monthlyRevenueUSD },
                { label: 'Annual Revenue (est.)', btc: rev.annualRevenue, usd: rev.annualRevenueUSD },
                { label: 'Total Rewards Paid', btc: rev.totalRewardsPaid, usd: null },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 13 }}>{row.label}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-green)' }}>
                    {fmtBtc(row.btc)}{row.usd !== null ? ` (${fmtUsd(row.usd)})` : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No revenue data.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pool Management ──────────────────────────────────────────────────────────

const EMPTY_POOL = {
  name: '', description: '', blockchain: 'Bitcoin',
  minimumStake: '', maximumStake: '',
  annualYieldMin: '', annualYieldMax: '',
  lockPeriodOptions: '7,30,60,90,180,365',
  fee: '', riskLevel: 'Low', capacity: '',
  tier: 'Starter', isActive: true, isLiquid: false, earlyWithdrawalFee: 5,
};

function PoolsTab() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editPool, setEditPool] = useState(null);
  const [form, setForm] = useState(EMPTY_POOL);

  const load = useCallback(() => {
    setLoading(true);
    stakingAdminAPI.getPools()
      .then(r => setPools(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditPool(null); setForm(EMPTY_POOL); setShowModal(true); };
  const openEdit = (p) => {
    setEditPool(p);
    setForm({ ...p, lockPeriodOptions: (p.lockPeriodOptions || []).join(',') });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      minimumStake: +form.minimumStake,
      maximumStake: +form.maximumStake,
      annualYieldMin: +form.annualYieldMin,
      annualYieldMax: +form.annualYieldMax,
      fee: +form.fee,
      capacity: +form.capacity,
      earlyWithdrawalFee: +form.earlyWithdrawalFee,
      lockPeriodOptions: String(form.lockPeriodOptions).split(',').map(v => parseInt(v.trim(), 10)).filter(Boolean),
    };
    try {
      if (editPool) {
        await stakingAdminAPI.updatePool(editPool._id, payload);
        setMsg({ type: 'success', text: '✅ Pool updated.' });
      } else {
        await stakingAdminAPI.createPool(payload);
        setMsg({ type: 'success', text: '✅ Pool created.' });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed.' });
    }
  };

  const toggleActive = async (p) => {
    try {
      await stakingAdminAPI.updatePool(p._id, { isActive: !p.isActive });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: 'Update failed.' });
    }
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      {type === 'select' ? (
        <select className="form-select" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <label className="toggle">
          <input type="checkbox" checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} />
          <span className="toggle-slider" />
        </label>
      ) : (
        <input type={type} className="form-input" value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          required={opts.required} step={opts.step} min={opts.min} />
      )}
    </div>
  );

  return (
    <div>
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openCreate}>+ New Pool</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tier</th>
                  <th>APY Range</th>
                  <th>Min / Max (BTC)</th>
                  <th>TVL</th>
                  <th>Participants</th>
                  <th>Risk</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pools.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.blockchain}</div>
                    </td>
                    <td><span className="badge badge-purple">{p.tier}</span></td>
                    <td style={{ color: 'var(--accent-green)', fontSize: 13 }}>{p.annualYieldMin}% – {p.annualYieldMax}%</td>
                    <td style={{ fontSize: 12 }}>{fmt(p.minimumStake, 4)} / {fmt(p.maximumStake, 4)}</td>
                    <td style={{ fontSize: 12 }}>{fmtBtc(p.currentTVL)}</td>
                    <td>{p.participants}</td>
                    <td>{riskBadge(p.riskLevel)}</td>
                    <td>
                      <label className="toggle" style={{ width: 36, height: 18 }}>
                        <input type="checkbox" checked={p.isActive} onChange={() => toggleActive(p)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pools.length && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 14 }}>No pools found.</p>}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">🏊 {editPool ? 'Edit Pool' : 'Create Pool'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                {field('Pool Name', 'name', 'text', { required: true })}
                {field('Blockchain', 'blockchain', 'text', { required: true })}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid-2">
                {field('Min Stake (BTC)', 'minimumStake', 'number', { required: true, step: '0.0001', min: '0' })}
                {field('Max Stake (BTC)', 'maximumStake', 'number', { required: true, step: '0.0001', min: '0' })}
              </div>
              <div className="grid-2">
                {field('APY Min (%)', 'annualYieldMin', 'number', { required: true, step: '0.01', min: '0' })}
                {field('APY Max (%)', 'annualYieldMax', 'number', { required: true, step: '0.01', min: '0' })}
              </div>
              <div className="grid-2">
                {field('Fee (%)', 'fee', 'number', { required: true, step: '0.01', min: '0' })}
                {field('Early Withdrawal Fee (%)', 'earlyWithdrawalFee', 'number', { step: '0.01', min: '0' })}
              </div>
              <div className="grid-2">
                {field('Capacity (BTC)', 'capacity', 'number', { required: true, step: '0.001', min: '0' })}
                <div className="form-group">
                  <label className="form-label">Lock Period Options (days, comma-separated)</label>
                  <input type="text" className="form-input" value={form.lockPeriodOptions}
                    onChange={e => setForm({ ...form, lockPeriodOptions: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                {field('Risk Level', 'riskLevel', 'select', { options: ['Very Low', 'Low', 'Low-Medium', 'Medium', 'High'] })}
                {field('Tier', 'tier', 'select', { options: ['Starter', 'Advanced', 'Professional', 'Elite', 'DeFi', 'Liquid'] })}
              </div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Active</label>
                  <label className="toggle" style={{ width: 36, height: 18, marginTop: 6 }}>
                    <input type="checkbox" checked={!!form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Liquid Pool</label>
                  <label className="toggle" style={{ width: 36, height: 18, marginTop: 6 }}>
                    <input type="checkbox" checked={!!form.isLiquid} onChange={e => setForm({ ...form, isLiquid: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {editPool ? '💾 Save Changes' : '➕ Create Pool'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stakers ──────────────────────────────────────────────────────────────────

function StakersTab() {
  const [stakers, setStakers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [payoutForm, setPayoutForm] = useState({ userId: '', stakeId: '', amount: '', note: '' });
  const [bonusForm, setBonusForm] = useState({ userId: '', amount: '', bonusType: 'Bonus', note: '' });
  const [showPayout, setShowPayout] = useState(false);
  const [showBonus, setShowBonus] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    stakingAdminAPI.getStakers({ page, limit: 20, ...(status ? { status } : {}) })
      .then(r => { setStakers(r.data.data); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handlePayout = async (e) => {
    e.preventDefault();
    try {
      await stakingAdminAPI.manualPayout(payoutForm);
      setMsg({ type: 'success', text: `✅ Payout of ${payoutForm.amount} BTC processed.` });
      setShowPayout(false);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Payout failed.' });
    }
  };

  const handleBonus = async (e) => {
    e.preventDefault();
    try {
      await stakingAdminAPI.issueBonus(bonusForm);
      setMsg({ type: 'success', text: `✅ Bonus of ${bonusForm.amount} BTC issued.` });
      setShowBonus(false);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Bonus failed.' });
    }
  };

  const openPayout = (s) => {
    setPayoutForm({ userId: s.userId?._id || s.userId, stakeId: s._id, amount: '', note: `Payout for ${s.userId?.username || ''}` });
    setShowPayout(true);
  };

  const openBonus = (s) => {
    setBonusForm({ userId: s.userId?._id || s.userId, amount: '', bonusType: 'Bonus', note: `Bonus for ${s.userId?.username || ''}` });
    setShowBonus(true);
  };

  const pages = Math.ceil(total / 20);

  return (
    <div>
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
            <option value="">All Statuses</option>
            {['Active', 'Completed', 'Withdrawn', 'Paused'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{total} stakes</span>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Pool</th>
                  <th>Amount (BTC)</th>
                  <th>APY</th>
                  <th>Lock (days)</th>
                  <th>Earned</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stakers.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.userId?.username || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.userId?.email || ''}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{s.poolId?.name || '—'} <span className="badge badge-purple" style={{ fontSize: 10 }}>{s.poolId?.tier || ''}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)', fontSize: 13 }}>{fmt(s.amount, 6)}</td>
                    <td style={{ color: 'var(--accent-blue)', fontSize: 13 }}>{fmt(s.currentAPY)}%</td>
                    <td style={{ fontSize: 12 }}>{s.lockPeriodDays}d</td>
                    <td style={{ fontSize: 12 }}>{fmt(s.earnedRewards, 6)}</td>
                    <td>{statusBadge(s.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => openPayout(s)}>💸 Pay</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openBonus(s)}>🎁 Bonus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!stakers.length && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 14 }}>No stakes found.</p>}
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {page} of {pages}</span>
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= pages}>Next →</button>
          </div>
        )}
      </div>

      {/* Manual Payout Modal */}
      {showPayout && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">💸 Manual Payout</h2>
              <button className="modal-close" onClick={() => setShowPayout(false)}>✕</button>
            </div>
            <form onSubmit={handlePayout}>
              <div className="form-group">
                <label className="form-label">Amount (BTC)</label>
                <input type="number" className="form-input" min="0.000001" step="0.000001" placeholder="0.001"
                  value={payoutForm.amount} onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <input type="text" className="form-input" value={payoutForm.note}
                  onChange={e => setPayoutForm({ ...payoutForm, note: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>✅ Process Payout</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayout(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Bonus Modal */}
      {showBonus && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">🎁 Issue Bonus</h2>
              <button className="modal-close" onClick={() => setShowBonus(false)}>✕</button>
            </div>
            <form onSubmit={handleBonus}>
              <div className="form-group">
                <label className="form-label">Bonus Type</label>
                <select className="form-select" value={bonusForm.bonusType}
                  onChange={e => setBonusForm({ ...bonusForm, bonusType: e.target.value })}>
                  <option value="Bonus">Bonus</option>
                  <option value="Referral">Referral</option>
                  <option value="Promotional">Promotional</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (BTC)</label>
                <input type="number" className="form-input" min="0.000001" step="0.000001" placeholder="0.001"
                  value={bonusForm.amount} onChange={e => setBonusForm({ ...bonusForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <input type="text" className="form-input" value={bonusForm.note}
                  onChange={e => setBonusForm({ ...bonusForm, note: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>✅ Issue Bonus</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBonus(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stakingAdminAPI.getAnalytics()
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{data?.newStakers30d || 0}</div>
          <div className="stat-label">New Stakers (30d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{data?.activeStakers || 0}</div>
          <div className="stat-label">Active Stakers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-value">{data?.churnRate || 0}%</div>
          <div className="stat-label">Churn Rate (30d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{fmtBtc(data?.avgStakeSize)}</div>
          <div className="stat-label">Avg Stake Size</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            Avg hold: {fmt(data?.avgHoldPeriod, 0)}d
          </div>
        </div>
      </div>

      {data?.tierDistribution?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">📊 Stake Distribution by Tier</div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Tier</th><th>Stakes</th><th>TVL (BTC)</th></tr>
              </thead>
              <tbody>
                {data.tierDistribution.map(t => (
                  <tr key={t._id}>
                    <td><span className="badge badge-purple">{t._id}</span></td>
                    <td>{t.count}</td>
                    <td style={{ color: 'var(--accent-green)' }}>{fmtBtc(t.tvl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.topPools?.length > 0 && (
        <div className="card">
          <div className="card-title">🏆 Top Pools by TVL</div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Pool</th><th>TVL (BTC)</th><th>Participants</th></tr>
              </thead>
              <tbody>
                {data.topPools.map(p => (
                  <tr key={p.name}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--accent-green)' }}>{fmtBtc(p.tvl)}</td>
                    <td>{p.participants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root StakingPanel ────────────────────────────────────────────────────────

const TABS = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'pools', label: '🏊 Pools' },
  { key: 'stakers', label: '👥 Stakers' },
  { key: 'analytics', label: '📈 Analytics' },
];

export default function StakingPanel() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'var(--transition)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'pools' && <PoolsTab />}
      {tab === 'stakers' && <StakersTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}
