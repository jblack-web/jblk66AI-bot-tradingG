import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marketplace as api } from '../services/api';

const MOCK_ORDER = {
  _id: 'ord001',
  status: 'shipped',
  total: 2549.98,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-16T14:20:00Z',
  paymentMethod: 'wallet_usd',
  items: [
    { name: 'Antminer S19 Pro 110TH/s', price: 2499.99, quantity: 1, emoji: '⛏️' },
    { name: 'ASIC Cooling Fan Set', price: 49.99, quantity: 1, emoji: '🌀' },
  ],
  shippingAddress: { name: 'John Doe', street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'US' },
  timeline: [
    { status: 'Order Placed', date: '2024-01-15 10:30', done: true },
    { status: 'Payment Confirmed', date: '2024-01-15 10:31', done: true },
    { status: 'Processing', date: '2024-01-15 14:00', done: true },
    { status: 'Shipped', date: '2024-01-16 14:20', done: true },
    { status: 'Delivered', date: null, done: false },
  ],
};

const STATUS_COLORS = { pending: 'warning', processing: 'secondary', shipped: 'secondary', completed: 'success', cancelled: 'danger' };

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrder(id)
      .then(data => setOrder(data.order || data))
      .catch(() => setOrder({ ...MOCK_ORDER, _id: id }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;
  if (!order) return <div className="page-wrapper"><div className="container"><div className="empty-state"><h3>Order not found</h3></div></div></div>;

  const subtotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
  const tax = subtotal * 0.08;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/orders">Orders</Link>
          <span className="sep">›</span>
          <span className="current">Order #{(order._id || '').toString().slice(-6).toUpperCase()}</span>
        </div>

        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Order #{(order._id || '').toString().slice(-6).toUpperCase()}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`badge badge-${STATUS_COLORS[order.status] || 'muted'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
            {order.status}
          </span>
        </div>

        <div className="grid-2" style={{ alignItems: 'start', marginBottom: '1.5rem' }}>
          {/* Timeline */}
          <div className="card">
            <div className="card-header"><span className="card-title">📍 Order Timeline</span></div>
            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
              {(order.timeline || []).map((step, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: i < order.timeline.length - 1 ? '1.25rem' : 0 }}>
                  {i < order.timeline.length - 1 && (
                    <div style={{ position: 'absolute', left: -27, top: 20, width: 2, height: '100%', background: step.done ? 'var(--success)' : 'var(--border)' }} />
                  )}
                  <div style={{ position: 'absolute', left: -34, top: 4, width: 16, height: 16, borderRadius: '50%', background: step.done ? 'var(--success)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {step.done && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: step.done ? 700 : 500, color: step.done ? 'var(--text)' : 'var(--text-muted)', fontSize: '0.92rem' }}>{step.status}</div>
                    {step.date && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{step.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="flex-col">
            <div className="card">
              <div className="card-header"><span className="card-title">🚚 Shipping Address</span></div>
              {order.shippingAddress ? (
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.92rem' }}>
                  <div style={{ color: 'var(--text)', fontWeight: 700 }}>{order.shippingAddress.name}</div>
                  <div>{order.shippingAddress.street}</div>
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
                  <div>{order.shippingAddress.country}</div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Digital delivery</p>
              )}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">💳 Payment</span></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Method: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{(order.paymentMethod || '').replace(/_/g, ' ').toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><span className="card-title">📦 Order Items</span></div>
          <div className="flex-col">
            {(order.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: '2rem', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card2)', borderRadius: 8 }}>
                  {item.emoji || '📦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div className="flex-between" style={{ marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <span>Tax</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.5rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex" style={{ gap: '0.75rem' }}>
          <Link to="/orders" className="btn btn-outline">← Back to Orders</Link>
          {order.status === 'shipped' && (
            <button className="btn btn-success" onClick={() => alert('Track your package with the shipping carrier.')}>📍 Track Shipment</button>
          )}
        </div>
      </div>
    </div>
  );
}
