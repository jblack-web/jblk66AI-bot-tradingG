import React, { useState, useEffect, useCallback } from 'react';
import { aiInsightsAPI } from '../utils/api';

const INSIGHT_TYPES = [
  '', 'trend_analysis', 'sentiment', 'price_prediction', 'technical_analysis',
  'risk_alert', 'opportunity', 'onchain', 'macro', 'correlation', 'anomaly',
];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];
const SENTIMENTS = ['bullish', 'bearish', 'neutral'];
const MARKETS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'CRYPTO', 'FOREX', 'STOCKS'];
const TARGET_TIERS = ['free', 'basic', 'advanced', 'premium'];

const priorityColors = {
  low: 'badge-gray',
  medium: 'badge-blue',
  high: 'badge-yellow',
  critical: 'badge-red',
};

const sentimentColors = {
  bullish: 'badge-green',
  bearish: 'badge-red',
  neutral: 'badge-gray',
};

const typeIcons = {
  trend_analysis: '📈',
  sentiment: '🧠',
  price_prediction: '🎯',
  technical_analysis: '📊',
  risk_alert: '⚠️',
  opportunity: '💡',
  onchain: '⛓️',
  macro: '🌍',
  correlation: '🔗',
  anomaly: '🚨',
};

const emptyForm = {
  type: 'trend_analysis',
  market: 'BTC/USDT',
  title: '',
  summary: '',
  confidence: 75,
  sentiment: 'neutral',
  priority: 'medium',
  isActive: true,
  generatedBy: 'AI',
  targetUsers: ['free', 'basic', 'advanced', 'premium'],
};

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({ type: '', market: '', priority: '' });

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await aiInsightsAPI.getAll(params);
      setInsights(res.data.insights);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  useEffect(() => {
    aiInsightsAPI.getConfig().then(res => setConfig(res.data.config)).catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await aiInsightsAPI.create(form);
      setMsg({ type: 'success', text: '✅ AI insight created successfully.' });
      setShowModal(false);
      setForm(emptyForm);
      fetchInsights();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create insight.' });
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await aiInsightsAPI.update(id, { isActive: !isActive });
      fetchInsights();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update insight.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this AI insight?')) return;
    try {
      await aiInsightsAPI.delete(id);
      setMsg({ type: 'success', text: '✅ Insight deleted.' });
      fetchInsights();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to delete insight.' });
    }
  };

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const toggleTargetUser = (tier) => {
    setForm(f => ({
      ...f,
      targetUsers: f.targetUsers.includes(tier)
        ? f.targetUsers.filter(t => t !== tier)
        : [...f.targetUsers, tier],
    }));
  };

  return (
    <div>
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* AI Config Banner */}
      {config && (
        <div className="card" style={{ marginBottom: 24, background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.3)' }}>
          <div className="card-title">🤖 AI Engine Configuration</div>
          <div className="stats-grid" style={{ marginTop: 12 }}>
            {Object.entries(config.accuracy).map(([key, val]) => (
              <div key={key} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent-green)' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>🔄 Update interval: <strong>{config.updateInterval}</strong></span>
            <span>🧬 Models: <strong>{config.models.join(', ')}</strong></span>
            <span>📡 Sources: <strong>{config.dataSources.slice(0, 4).join(', ')}...</strong></span>
          </div>
        </div>
      )}

      {/* Filters + Add Button */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={filters.type} onChange={e => setFilter('type', e.target.value)} style={{ width: 160 }}>
              {INSIGHT_TYPES.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Market</label>
            <select className="form-select" value={filters.market} onChange={e => setFilter('market', e.target.value)} style={{ width: 140 }}>
              <option value="">All Markets</option>
              {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)} style={{ width: 130 }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ type: '', market: '', priority: '' })}>
            🔄 Reset
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ Add AI Insight
            </button>
          </div>
        </div>
      </div>

      {/* Insights Table */}
      <div className="card">
        <div className="card-title">🤖 AI Market Insights ({insights.length})</div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : insights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h3 style={{ marginBottom: 8 }}>No AI insights yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create your first AI market insight using the button above.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Market</th>
                  <th>Title</th>
                  <th>Sentiment</th>
                  <th>Confidence</th>
                  <th>Priority</th>
                  <th>Tiers</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {insights.map(insight => (
                  <tr key={insight._id}>
                    <td>
                      <span title={insight.type}>
                        {typeIcons[insight.type] || '📌'}{' '}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {insight.type?.replace(/_/g, ' ')}
                        </span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{insight.market}</td>
                    <td style={{ maxWidth: 240 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insight.title}</div>
                      {insight.summary && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insight.summary}</div>
                      )}
                    </td>
                    <td>
                      {insight.sentiment && (
                        <span className={`badge ${sentimentColors[insight.sentiment] || 'badge-gray'}`}>
                          {insight.sentiment === 'bullish' ? '↑' : insight.sentiment === 'bearish' ? '↓' : '→'} {insight.sentiment}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 3, minWidth: 50 }}>
                          <div style={{
                            width: `${insight.confidence || 0}%`,
                            height: '100%',
                            background: (insight.confidence || 0) >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)',
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32 }}>{insight.confidence || 0}%</span>
                      </div>
                    </td>
                    <td><span className={`badge ${priorityColors[insight.priority] || 'badge-gray'}`}>{insight.priority}</span></td>
                    <td style={{ fontSize: 11 }}>
                      {(insight.targetUsers || []).map(t => (
                        <span key={t} className="badge badge-gray" style={{ marginRight: 2, padding: '2px 5px' }}>{t}</span>
                      ))}
                    </td>
                    <td>
                      <label className="toggle" style={{ display: 'inline-flex' }}>
                        <input type="checkbox" checked={insight.isActive} onChange={() => handleToggle(insight._id, insight.isActive)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(insight._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Insight Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">🤖 Create AI Market Insight</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
                    {INSIGHT_TYPES.filter(Boolean).map(t => (
                      <option key={t} value={t}>{typeIcons[t]} {t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Market *</label>
                  <select className="form-select" value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))} required>
                    {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="BTC breaking above key resistance at $70k..." value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Summary</label>
                <textarea className="form-input" rows={3} placeholder="AI analysis summary..."
                  value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Sentiment</label>
                  <select className="form-select" value={form.sentiment} onChange={e => setForm(f => ({ ...f, sentiment: e.target.value }))}>
                    {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confidence: {form.confidence}%</label>
                <input type="range" min={0} max={100} value={form.confidence}
                  onChange={e => setForm(f => ({ ...f, confidence: +e.target.value }))}
                  style={{ width: '100%', accentColor: 'var(--accent-blue)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target User Tiers</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  {TARGET_TIERS.map(tier => (
                    <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.targetUsers.includes(tier)} onChange={() => toggleTargetUser(tier)} />
                      {tier}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>🤖 Create Insight</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
