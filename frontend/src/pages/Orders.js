import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplace as api } from '../services/api';

const STATUS_COLORS = { pending: 'warning', processing: 'secondary', shipped: 'secondary', completed: 'success', cancelled: 'danger' };

const MOCK_ORDERS = [
  { _id: 'ord001', total: 2549.98, status: 'completed', createdAt: '2024-01-15', itemCount: 2 },
  { _id: 'ord002', total: 49.99, status: 'processing', createdAt: '2024-01-20', itemCount: 1 },
  { _id: 'ord003', total: 1899.00, status: 'shipped', createdAt: '2024-01-22', itemCount: 1 },
  { _id: 'ord004', total: 89.99, status: 'pending', createdAt: '2024-01-25', itemCount: 3 },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getOrders()
      .then(data => setOrders(data.orders || MOCK_ORDERS))
      .catch(() => setOrders(MOCK_ORDERS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>📦 My Orders</h1>
          <p>Track and manage your marketplace orders</p>
        </div>

        {/* Filters */}
        <div className="flex-wrap" style={{ marginBottom: '1.5rem', gap: '0.5rem' }}>
          {['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No orders found</h3>
              <p>{filter === 'all' ? "You haven't placed any orders yet." : `No ${filter} orders.`}</p>
              <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Marketplace</Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        #{(order._id || '').toString().slice(-6).toUpperCase()}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {order.itemCount || order.items?.length || '—'} item{(order.itemCount || order.items?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 700 }}>${Number(order.total).toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${STATUS_COLORS[order.status] || 'muted'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/orders/${order._id}`} className="btn btn-outline btn-sm">View Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
