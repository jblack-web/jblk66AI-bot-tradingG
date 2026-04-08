import React, { useState, useEffect } from 'react';
import { withdrawalAPI } from '../utils/api';

export default function WithdrawalSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await withdrawalAPI.getFullSettings();
      setSettings(res.data.settings);
      const pending = await withdrawalAPI.getPending();
      setPendingCount(pending.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleToggleMode = async () => {
    setToggling(true);
    try {
      const res = await withdrawalAPI.toggleMode();
      setSettings(prev => ({ ...prev, withdrawalMode: res.data.withdrawalMode }));
      setMsg({ type: 'success', text: `✅ Withdrawal mode switched to ${res.data.withdrawalMode.toUpperCase()}` });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to toggle mode.' });
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await withdrawalAPI.updateSettings(settings);
      setMsg({ type: 'success', text: '✅ Withdrawal settings saved successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const updateNested = (parent, key, value) => setSettings(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!settings) return <div className="alert alert-error">Failed to load settings.</div>;

  const isAuto = settings.withdrawalMode === 'auto';

  return (
    <div>
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Mode Toggle Banner */}
      <div className="card" style={{ marginBottom: 24, background: isAuto ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)', borderColor: isAuto ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Withdrawal Mode
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500 }}>
              {isAuto
                ? '🤖 AUTO MODE: Withdrawals are processed automatically without admin approval.'
                : '👤 MANUAL MODE: All withdrawals require admin approval before processing.'}
            </p>
          </div>
          <div style={{ display: 'flex', flex: 'column', alignItems: 'center', gap: 12 }}>
            <div className={`mode-badge ${isAuto ? 'mode-auto' : 'mode-manual'}`} style={{ fontSize: 16, padding: '10px 20px' }}>
              {isAuto ? '🤖 AUTO WITHDRAWAL' : '👤 MANUAL APPROVAL'}
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="toggle-wrapper">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manual</span>
                <label className="toggle">
                  <input type="checkbox" checked={isAuto} onChange={handleToggleMode} disabled={toggling} />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Auto</span>
              </div>
            </div>
          </div>
        </div>

        {pendingCount > 0 && !isAuto && (
          <div className="alert alert-warning" style={{ marginTop: 16, marginBottom: 0 }}>
            ⏳ <strong>{pendingCount}</strong> withdrawal(s) are currently pending approval. <a href="/admin/payments" style={{ color: 'var(--accent-blue)' }}>Review now →</a>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave}>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Fee Settings */}
          <div className="card">
            <div className="card-title">💸 Fee & Limits</div>
            <div className="form-group">
              <label className="form-label">Withdrawal Fee (%)</label>
              <input type="number" className="form-input" step="0.1" min="0" max="10"
                value={settings.withdrawalFeePercent}
                onChange={e => updateField('withdrawalFeePercent', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fixed Fee (USD)</label>
              <input type="number" className="form-input" step="0.01" min="0"
                value={settings.withdrawalFeeFixed}
                onChange={e => updateField('withdrawalFeeFixed', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Withdrawal (USD)</label>
              <input type="number" className="form-input" min="0"
                value={settings.minWithdrawalAmount}
                onChange={e => updateField('minWithdrawalAmount', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Withdrawal (USD)</label>
              <input type="number" className="form-input" min="0"
                value={settings.maxWithdrawalAmount}
                onChange={e => updateField('maxWithdrawalAmount', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Daily Withdrawal (USD)</label>
              <input type="number" className="form-input" min="0"
                value={settings.maxDailyWithdrawal}
                onChange={e => updateField('maxDailyWithdrawal', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Monthly Withdrawal (USD)</label>
              <input type="number" className="form-input" min="0"
                value={settings.maxMonthlyWithdrawal}
                onChange={e => updateField('maxMonthlyWithdrawal', +e.target.value)} />
            </div>
          </div>

          {/* Auto-Withdrawal Settings */}
          <div className="card">
            <div className="card-title">🤖 Auto-Withdrawal Settings</div>
            <div className="form-group">
              <label className="form-label">Auto-Approval Threshold (USD)</label>
              <input type="number" className="form-input" min="0"
                value={settings.autoWithdrawalThreshold}
                onChange={e => updateField('autoWithdrawalThreshold', +e.target.value)}
                disabled={!isAuto} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Amounts below this are auto-approved</p>
            </div>
            <div className="form-group">
              <label className="form-label">Auto-Withdrawal Max Amount (USD)</label>
              <input type="number" className="form-input" min="0"
                value={settings.autoWithdrawalMaxAmount}
                onChange={e => updateField('autoWithdrawalMaxAmount', +e.target.value)}
                disabled={!isAuto} />
            </div>
            <div className="form-group">
              <label className="form-label">Cooldown Period (hours)</label>
              <input type="number" className="form-input" min="0"
                value={settings.autoWithdrawalCooldownHours}
                onChange={e => updateField('autoWithdrawalCooldownHours', +e.target.value)}
                disabled={!isAuto} />
            </div>
            <div className="form-group">
              <label className="form-label">Auto-Approve for Tiers</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                {['free', 'basic', 'advanced', 'premium'].map(tier => (
                  <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.autoApprovedTiers?.includes(tier)}
                      onChange={e => {
                        const arr = settings.autoApprovedTiers || [];
                        updateField('autoApprovedTiers', e.target.checked ? [...arr, tier] : arr.filter(t => t !== tier));
                      }}
                      disabled={!isAuto}
                    />
                    {tier}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* KYC & Security */}
          <div className="card">
            <div className="card-title">🔐 KYC & Security</div>
            <div className="form-group">
              <div className="toggle-wrapper">
                <label className="toggle">
                  <input type="checkbox" checked={settings.requireKYC}
                    onChange={e => updateField('requireKYC', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 14 }}>Require KYC Verification</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Max Withdrawal Without KYC (USD)</label>
              <input type="number" className="form-input" min="0"
                value={settings.kycLimitWithout}
                onChange={e => updateField('kycLimitWithout', +e.target.value)}
                disabled={!settings.requireKYC} />
            </div>
          </div>

          {/* Supported Methods */}
          <div className="card">
            <div className="card-title">💳 Supported Withdrawal Methods</div>
            {settings.supportedMethods && Object.entries(settings.supportedMethods).map(([method, enabled]) => (
              <div key={method} className="form-group" style={{ marginBottom: 12 }}>
                <div className="toggle-wrapper">
                  <label className="toggle">
                    <input type="checkbox" checked={enabled}
                      onChange={e => updateNested('supportedMethods', method, e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                  <span style={{ fontSize: 14, textTransform: 'capitalize' }}>
                    {method === 'crypto' ? '₿ Cryptocurrency' :
                      method === 'bankTransfer' ? '🏦 Bank Transfer' :
                        method === 'paypal' ? '🅿️ PayPal' : '💳 Card'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ marginBottom: 24 }}>
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </form>
    </div>
  );
}
