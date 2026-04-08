import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as api } from '../services/api';

const MOCK_PENDING = [
  { _id: 'p1', name: 'RTX 4080 GPU Bundle', seller: 'TechMinerPro', price: 1299.99, category: 'Hardware', submittedAt: '2024-01-25', emoji: '🖥️' },
  { _id: 'p2', name: 'Advanced DeFi Course', seller: 'CryptoAcademy', price: 89.99, category: 'Educational', submittedAt: '2024-01-26', emoji: '📚' },
  { _id: 'p3', name: 'Mining Farm Management Software', seller: 'HashSoft', price: 299.00, category: 'Software', submittedAt: '2024-01-27', emoji: '💻' },
];

const MOCK_STATS = {
  totalOrders: 1284,
  totalRevenue: 284000,
  pendingApprovals: 3,
  activeSellers: 48,
};

export default function AdminMarketplace() {
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getPendingProducts().catch(() => ({ products: MOCK_PENDING })),
    ]).then(([p]) => {
      setPending(p.products || MOCK_PENDING);
      setStats(MOCK_STATS);
    }).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await api.approveProduct(id);
      setPending(ps => ps.filter(p => p._id !== id));
      setMsg('✓ Product approved and listed');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to approve'));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this product?')) return;
    setProcessing(id);
    try {
      await api.rejectProduct(id);
      setPending(ps => ps.filter(p => p._id !== id));
      setMsg('Product rejected');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to reject'));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="sep">›</span>
          <span className="current">Marketplace</span>
        </div>
        <div className="page-header">
          <h1>🛒 Marketplace Management</h1>
          <p>Review products, manage orders, oversee sellers</p>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : msg.startsWith('Error') ? 'alert-error' : 'alert-warning'}`}>{msg}</div>}

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Orders', value: (stats?.totalOrders || 0).toLocaleString(), icon: '📦' },
            { label: 'Total Revenue', value: `$${((stats?.totalRevenue || 0) / 1000).toFixed(0)}k`, icon: '💰' },
            { label: 'Pending Approvals', value: pending.length, icon: '⏳', danger: pending.length > 0 },
            { label: 'Active Sellers', value: stats?.activeSellers || 0, icon: '🏪' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderColor: s.danger ? 'var(--warning)' : 'var(--border)' }}>
              <div className="flex" style={{ marginBottom: '0.4rem' }}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span><span className="stat-label">{s.label}</span></div>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: s.danger ? 'var(--warning)' : 'inherit' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pending Approvals */}
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: pending.length > 0 ? 'var(--warning)' : 'var(--border)' }}>
          <div className="card-header">
            <span className="card-title">
              ⏳ Pending Product Approvals
              {pending.length > 0 && <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>{pending.length}</span>}
            </span>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : pending.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <div className="empty-icon">✅</div>
              <h3>All caught up!</h3>
              <p>No products pending review</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Submitted</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {pending.map(product => (
                    <tr key={product._id}>
                      <td>
                        <div className="flex" style={{ gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{product.emoji || '📦'}</span>
                          <span style={{ fontWeight: 700 }}>{product.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{product.seller}</td>
                      <td><span className="badge badge-muted">{product.category}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${product.price}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(product.submittedAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex" style={{ gap: '0.4rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(product._id)} disabled={processing === product._id}>
                            {processing === product._id ? '...' : '✓ Approve'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(product._id)} disabled={processing === product._id}>
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seller Overview */}
        <div className="card">
          <div className="card-header"><span className="card-title">🏪 Top Sellers</span></div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Seller</th><th>Products</th><th>Orders</th><th>Revenue</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[
                  { name: 'TechMinerPro', products: 12, orders: 143, revenue: 42800, status: 'active' },
                  { name: 'CryptoAcademy', products: 8, orders: 312, revenue: 28000, status: 'active' },
                  { name: 'HashSoft', products: 5, orders: 87, revenue: 15600, status: 'active' },
                  { name: 'MiningGear Co.', products: 22, orders: 201, revenue: 198000, status: 'active' },
                ].map(s => (
                  <tr key={s.name}>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td>{s.products}</td>
                    <td>{s.orders}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>${s.revenue.toLocaleString()}</td>
                    <td><span className="badge badge-success">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
