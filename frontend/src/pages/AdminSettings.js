import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as api } from '../services/api';

const MOCK_SETTINGS = {
  withdrawMode: 'manual',
  miningPayoutFrequency: 'daily',
  marketplaceCommission: 5,
  referralCommission: 10,
  withdrawFee: 0.5,
  depositFee: 0,
  tradingFee: 0.1,
};

const MOCK_PENDING_WITHDRAWALS = [
  { walletId: 'w1', transaction: { _id: 't1', currency: 'BTC', amount: 0.05, timestamp: '2024-01-26T10:30:00Z', status: 'pending' }, user: { name: 'John Doe', email: 'john@example.com' } },
  { walletId: 'w2', transaction: { _id: 't2', currency: 'ETH', amount: 0.5, timestamp: '2024-01-26T11:15:00Z', status: 'pending' }, user: { name: 'Alice Smith', email: 'alice@example.com' } },
  { walletId: 'w3', transaction: { _id: 't3', currency: 'USDT', amount: 250, timestamp: '2024-01-26T12:00:00Z', status: 'pending' }, user: { name: 'Bob Johnson', email: 'bob@example.com' } },
  { walletId: 'w4', transaction: { _id: 't4', currency: 'BTC', amount: 0.02, timestamp: '2024-01-26T13:45:00Z', status: 'pending' }, user: { name: 'Carol Williams', email: 'carol@example.com' } },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => {
    Promise.all([
      api.getSettings().catch(() => ({ settings: MOCK_SETTINGS })),
      api.getPendingWithdrawals().catch(() => ({ withdrawals: MOCK_PENDING_WITHDRAWALS })),
    ]).then(([s, w]) => {
      setSettings(s.settings || MOCK_SETTINGS);
      setPendingWithdrawals(w.withdrawals || MOCK_PENDING_WITHDRAWALS);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggleMode = async () => {
    const newMode = settings.withdrawMode === 'manual' ? 'auto' : 'manual';
    const confirmed = window.confirm(
      `Switch to ${newMode.toUpperCase()} mode?\n\n` +
      (newMode === 'manual' ? '⚠️ All future withdrawals will require manual admin approval.' : '⚡ Withdrawals will be processed instantly without approval.')
    );
    if (!confirmed) return;
    setToggling(true);
    try {
      await api.setWithdrawMode(newMode);
      setSettings(s => ({ ...s, withdrawMode: newMode }));
      setMsg(`✓ Switched to ${newMode.toUpperCase()} mode`);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to switch mode'));
    } finally {
      setToggling(false);
    }
  };

  const handleSaveSettings = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setMsg('✓ Settings saved successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawal = async (walletId, txId, action) => {
    const key = `${walletId}-${txId}`;
    setProcessingId(key);
    try {
      await api.processWithdrawal(walletId, txId, action);
      setPendingWithdrawals(ws => ws.filter(w => !(w.walletId === walletId && w.transaction._id === txId)));
      setMsg(action === 'approve' ? '✓ Withdrawal approved and processed' : 'Withdrawal rejected');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Action failed'));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  const isManual = settings?.withdrawMode === 'manual';

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="sep">›</span>
          <span className="current">Settings</span>
        </div>
        <div className="page-header">
          <h1>⚙️ Platform Settings</h1>
          <p>Configure fees, rates, and platform behavior</p>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        {/* ⚠️ WITHDRAW MODE — MOST PROMINENT SECTION */}
        <div className="withdraw-mode-card" style={{ marginBottom: '2rem' }}>
          <div className="withdraw-mode-title" style={{ fontSize: '1.25rem' }}>⚠️ WITHDRAWAL MODE CONTROL</div>

          <div style={{ marginBottom: '1.5rem' }}>
            <span className={`mode-badge-large ${isManual ? 'manual' : 'auto'}`} style={{ fontSize: '1.25rem' }}>
              {isManual ? '🔒 MANUAL MODE ACTIVE' : '⚡ AUTO MODE ACTIVE'}
            </span>
          </div>

          <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: `2px solid ${isManual ? 'var(--danger)' : 'var(--border)'}` }}>
              <div style={{ fontWeight: 800, color: 'var(--danger)', marginBottom: '0.5rem' }}>🔒 MANUAL Mode</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                All withdrawal requests are held in a queue. The admin must manually review and approve or reject each withdrawal before funds are released.
              </p>
            </div>
            <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: `2px solid ${!isManual ? 'var(--success)' : 'var(--border)'}` }}>
              <div style={{ fontWeight: 800, color: 'var(--success)', marginBottom: '0.5rem' }}>⚡ AUTO Mode</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Withdrawal requests are automatically processed and approved instantly without requiring admin review. Funds are sent immediately.
              </p>
            </div>
          </div>

          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <label className="toggle-switch" onClick={!toggling ? handleToggleMode : undefined} style={{ opacity: toggling ? 0.6 : 1, cursor: 'pointer' }}>
              <div className={`toggle-track ${isManual ? 'off' : 'on'}`}>
                <div className="toggle-thumb" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: isManual ? 'var(--danger)' : 'var(--success)' }}>
                Currently: {isManual ? 'MANUAL' : 'AUTO'}
              </span>
            </label>

            <button
              className={`btn btn-lg ${isManual ? 'btn-success' : 'btn-danger'}`}
              onClick={handleToggleMode}
              disabled={toggling}
              style={{ minWidth: 240 }}
            >
              {toggling
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Switching Mode...</>
                : isManual ? '⚡ Switch to AUTO (Instant Withdrawals)' : '🔒 Switch to MANUAL (Require Approval)'}
            </button>
          </div>
        </div>

        {/* Pending Withdrawals Queue */}
        {isManual && (
          <div className="card" style={{ marginBottom: '2rem', borderColor: pendingWithdrawals.length > 0 ? 'var(--warning)' : 'var(--border)' }}>
            <div className="card-header">
              <span className="card-title">
                ⏳ Pending Withdrawal Queue
                <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>{pendingWithdrawals.length}</span>
              </span>
              {pendingWithdrawals.length > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>
                  ${pendingWithdrawals.reduce((s, w) => s + (w.transaction?.amount || 0), 0).toLocaleString()} total pending
                </span>
              )}
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-icon">✅</div>
                <h3>No pending withdrawals</h3>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>User</th><th>Amount</th><th>Currency</th><th>USD Value</th><th>Requested</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {pendingWithdrawals.map(w => {
                      const key = `${w.walletId}-${w.transaction?._id}`;
                      return (
                      <tr key={key}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{w.user?.email || w.user?.name}</td>
                        <td style={{ fontWeight: 700 }}>{w.transaction?.amount}</td>
                        <td><span className="badge badge-muted">{w.transaction?.currency}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>—</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{w.transaction?.timestamp ? new Date(w.transaction.timestamp).toLocaleString() : ''}</td>
                        <td>
                          <div className="flex" style={{ gap: '0.4rem' }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleWithdrawal(w.walletId, w.transaction._id, 'approve')} disabled={processingId === key}>
                              {processingId === key ? '...' : '✓ Approve'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleWithdrawal(w.walletId, w.transaction._id, 'reject')} disabled={processingId === key}>
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Platform Settings Form */}
        <form onSubmit={handleSaveSettings}>
          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">💰 Fee Structure</span></div>
              <div className="form-group">
                <label>Withdrawal Fee (%)</label>
                <input type="number" className="form-control" step="0.01" value={settings?.withdrawFee || 0} onChange={e => setSettings(s => ({ ...s, withdrawFee: parseFloat(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Deposit Fee (%)</label>
                <input type="number" className="form-control" step="0.01" value={settings?.depositFee || 0} onChange={e => setSettings(s => ({ ...s, depositFee: parseFloat(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Trading Fee (%)</label>
                <input type="number" className="form-control" step="0.01" value={settings?.tradingFee || 0} onChange={e => setSettings(s => ({ ...s, tradingFee: parseFloat(e.target.value) }))} />
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">⚙️ Platform Configuration</span></div>
              <div className="form-group">
                <label>Mining Payout Frequency</label>
                <select className="form-control" value={settings?.miningPayoutFrequency || 'daily'} onChange={e => setSettings(s => ({ ...s, miningPayoutFrequency: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Marketplace Commission (%)</label>
                <input type="number" className="form-control" step="0.1" value={settings?.marketplaceCommission || 5} onChange={e => setSettings(s => ({ ...s, marketplaceCommission: parseFloat(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Referral Commission (%)</label>
                <input type="number" className="form-control" step="0.1" value={settings?.referralCommission || 10} onChange={e => setSettings(s => ({ ...s, referralCommission: parseFloat(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : '💾 Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
