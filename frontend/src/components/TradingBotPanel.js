import React, { useState, useEffect, useCallback } from 'react';
import { tradingAPI } from '../utils/api';

const TRADING_PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT'];
const STRATEGIES = ['momentum', 'mean_reversion', 'trend_following', 'ai_signals'];
const TRADE_TYPES = ['spot', 'futures'];

const strategyLabels = {
  momentum: '⚡ Momentum',
  mean_reversion: '↕️ Mean Reversion',
  trend_following: '📈 Trend Following',
  ai_signals: '🤖 AI Signals',
};

function PnlBadge({ value }) {
  const isPositive = value >= 0;
  return (
    <span style={{ fontWeight: 700, color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 14 }}>
      {isPositive ? '+' : ''}${value?.toFixed(2) || '0.00'}
    </span>
  );
}

function WinRate({ wins, losses }) {
  const total = wins + losses;
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 3, minWidth: 50 }}>
        <div style={{ width: `${rate}%`, height: '100%', background: rate >= 55 ? 'var(--accent-green)' : rate >= 45 ? 'var(--accent-yellow)' : 'var(--accent-red)', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, minWidth: 34 }}>{rate}%</span>
    </div>
  );
}

export default function TradingBotPanel() {
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [filterActive, setFilterActive] = useState('');

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterActive !== '') params.isActive = filterActive;
      const res = await tradingAPI.adminGetAll(params);
      setSchedules(res.data.schedules);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleCronInfo = () => {
    setMsg({
      type: 'success',
      text: '🕒 Cron jobs run automated trades at: 08:00, 11:00, 14:00, 17:00, 20:00 (server time) daily.',
    });
  };

  return (
    <div>
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Stats Banner */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-value">{stats.totalSchedules || 0}</div>
            <div className="stat-label">Total Bots</div>
            <div className="stat-change up">↑ Active: {stats.activeSchedules || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{stats.totalExecuted || 0}</div>
            <div className="stat-label">Total Trades</div>
            <div className="stat-change up">↑ Executed all time</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value" style={{ color: (stats.totalPnl || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {(stats.totalPnl || 0) >= 0 ? '+' : ''}${(stats.totalPnl || 0).toFixed(2)}
            </div>
            <div className="stat-label">Total PnL</div>
            <div className="stat-change up">All bots combined</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">
              {(stats.totalWins || 0) + (stats.totalLosses || 0) > 0
                ? Math.round(((stats.totalWins || 0) / ((stats.totalWins || 0) + (stats.totalLosses || 0))) * 100)
                : 0}%
            </div>
            <div className="stat-label">Win Rate</div>
            <div className="stat-change">{stats.totalWins || 0}W / {stats.totalLosses || 0}L</div>
          </div>
        </div>
      )}

      {/* Cron Info + Filter */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label className="form-label">Filter</label>
            <select className="form-select" value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{ width: 160 }}>
              <option value="">All Bots</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }} onClick={fetchSchedules}>
            🔄 Refresh
          </button>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 20 }} onClick={handleCronInfo}>
            🕒 Cron Schedule
          </button>
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {schedules.length} bot{schedules.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="card">
        <div className="card-title">🤖 Automated Trading Bots</div>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : schedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h3 style={{ marginBottom: 8 }}>No trading bots yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Users can create automated trading bots from their account. Once created, they appear here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bot Name</th>
                  <th>User</th>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Strategy</th>
                  <th>Trade Amt</th>
                  <th>SL / TP</th>
                  <th>Today</th>
                  <th>Total</th>
                  <th>PnL</th>
                  <th>Win Rate</th>
                  <th>Status</th>
                  <th>Last Run</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{s.name || 'Unnamed Bot'}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.user?.username || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.user?.email}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-blue)', fontSize: 13 }}>{s.tradingPair}</td>
                    <td>
                      <span className={`badge ${s.tradeType === 'futures' ? 'badge-red' : 'badge-blue'}`}>
                        {s.tradeType}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{strategyLabels[s.strategy] || s.strategy}</td>
                    <td style={{ fontWeight: 600 }}>${s.tradeAmount?.toFixed(2)}</td>
                    <td style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--accent-red)' }}>SL {s.stopLossPercent}%</span>
                      {' / '}
                      <span style={{ color: 'var(--accent-green)' }}>TP {s.takeProfitPercent}%</span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{s.executedToday}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/{s.maxTradesPerDay}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{s.totalExecuted}</td>
                    <td><PnlBadge value={s.totalPnl} /></td>
                    <td style={{ minWidth: 100 }}>
                      <WinRate wins={s.winCount} losses={s.lossCount} />
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {s.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {s.lastExecutedAt ? new Date(s.lastExecutedAt).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Strategy Guide */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">📖 Trading Strategy Guide</div>
        <div className="grid-2">
          {Object.entries(strategyLabels).map(([key, label]) => (
            <div key={key} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {key === 'momentum' && 'Trades in the direction of strong price momentum. Best for trending markets.'}
                {key === 'mean_reversion' && 'Bets on price returning to historical average. Best for ranging markets.'}
                {key === 'trend_following' && 'Follows established market trends using moving averages and breakouts.'}
                {key === 'ai_signals' && 'Uses AI/ML models (LSTM, Transformer) to predict optimal entry/exit points.'}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', fontSize: 12, color: 'var(--text-secondary)' }}>
          🕒 <strong>Cron Schedule:</strong> Bots execute at 08:00, 11:00, 14:00, 17:00, and 20:00 daily (server time). Win/loss simulation uses configurable SL/TP percentages with a 55% base win probability for AI signals strategy.
        </div>
      </div>
    </div>
  );
}
