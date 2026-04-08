import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';

export default function DashboardHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const stats = data?.stats || {};

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalUsers?.toLocaleString() || '0'}</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-change up">↑ Active: {stats.activeUsers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎨</div>
          <div className="stat-value">{stats.totalTemplates?.toLocaleString() || '0'}</div>
          <div className="stat-label">Total Templates</div>
          <div className="stat-change up">↑ Published: {stats.publishedTemplates || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">${(stats.totalDepositsAmount || 0).toLocaleString()}</div>
          <div className="stat-label">Total Deposits</div>
          <div className="stat-change up">↑ All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-value">${(stats.totalWithdrawalsAmount || 0).toLocaleString()}</div>
          <div className="stat-label">Total Withdrawals</div>
          <div className="stat-change down">⏳ Pending: {stats.pendingWithdrawals || 0}</div>
        </div>
      </div>

      {/* Tier Distribution + Recent Users */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">👥 User Tier Distribution</div>
          {data?.tierDistribution?.length ? (
            <div>
              {data.tierDistribution.map(tier => (
                <div key={tier._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ textTransform: 'capitalize', fontSize: 14 }}>
                    {tier._id === 'free' ? '🆓' : tier._id === 'basic' ? '🔵' : tier._id === 'advanced' ? '🟣' : '⭐'} {tier._id || 'Free'}
                  </span>
                  <span className="badge badge-blue">{tier.count} users</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No users yet. <a href="/api/seed" style={{ color: 'var(--accent-blue)' }}>Seed data</a> to get started.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">🆕 Recent Users</div>
          {data?.recentUsers?.length ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Tier</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{user.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${user.currentTier === 'premium' ? 'badge-yellow' : user.currentTier === 'advanced' ? 'badge-purple' : user.currentTier === 'basic' ? 'badge-blue' : 'badge-gray'}`}>
                          {user.currentTier || 'free'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No users yet.</p>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="card-title">💳 Recent Transactions</div>
        {data?.recentPayments?.length ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.transactionId?.slice(-8) || 'N/A'}</td>
                    <td>
                      <span className={`badge ${p.type === 'deposit' ? 'badge-green' : p.type === 'withdrawal' ? 'badge-red' : p.type === 'send' ? 'badge-blue' : 'badge-gray'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.sender?.username || p.receiver?.username || '—'}</td>
                    <td style={{ fontWeight: 600, color: p.type === 'deposit' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      ${p.amount?.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'completed' ? 'badge-green' : p.status === 'pending' ? 'badge-yellow' : p.status === 'failed' ? 'badge-red' : 'badge-gray'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No transactions yet.</p>
        )}
      </div>
    </div>
  );
}
