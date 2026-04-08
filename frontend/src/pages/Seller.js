import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { seller as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MOCK_STATS = { revenue: 18400, orders: 124, products: 8, rating: 4.7 };

const MOCK_PRODUCTS = [
  { _id: 's1', name: 'GPU Mining Rig 6x RTX 3080', price: 4999.99, stock: 3, orders: 12, status: 'active', emoji: '🖥️' },
  { _id: 's2', name: 'ASIC Mining Course Bundle', price: 79.99, stock: 999, orders: 43, status: 'active', emoji: '📚' },
  { _id: 's3', name: 'Mining Rig Frame Pro', price: 199.00, stock: 10, orders: 7, status: 'pending', emoji: '🔧' },
];

const MOCK_ORDERS = [
  { _id: 'so1', buyer: 'customer1@mail.com', product: 'GPU Mining Rig', amount: 4999.99, status: 'pending', date: '2024-01-26' },
  { _id: 'so2', buyer: 'customer2@mail.com', product: 'Mining Course', amount: 79.99, status: 'completed', date: '2024-01-25' },
];

export default function Seller() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: 'Hardware', stock: 1 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.getStats().catch(() => ({ stats: MOCK_STATS })),
      api.getProducts().catch(() => ({ products: MOCK_PRODUCTS })),
      api.getOrders().catch(() => ({ orders: MOCK_ORDERS })),
    ]).then(([s, p, o]) => {
      setStats(s.stats || MOCK_STATS);
      setProducts(p.products || MOCK_PRODUCTS);
      setOrders(o.orders || MOCK_ORDERS);
    }).finally(() => setLoading(false));
  }, []);

  const handleAddProduct = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createProduct(newProduct);
      setProducts(ps => [...ps, res.product || { ...newProduct, _id: Date.now().toString(), orders: 0, status: 'pending', emoji: '📦' }]);
      setShowAddProduct(false);
      setNewProduct({ name: '', price: '', description: '', category: 'Hardware', stock: 1 });
      setMsg('✓ Product submitted for review');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to add product'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(ps => ps.filter(p => p._id !== id));
      setMsg('✓ Product removed');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to delete'));
    }
  };

  const handleFulfill = async (orderId) => {
    try {
      await api.fulfillOrder(orderId);
      setOrders(os => os.map(o => o._id === orderId ? { ...o, status: 'fulfilled' } : o));
      setMsg('✓ Order marked as fulfilled');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to fulfill'));
    }
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>🏪 Seller Dashboard</h1>
          <p>Manage your store, products and orders</p>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        {/* Store Stats */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Revenue', value: `$${(stats?.revenue || 0).toLocaleString()}`, icon: '💰', color: 'var(--success)' },
            { label: 'Total Orders', value: stats?.orders || 0, icon: '📦', color: 'var(--secondary)' },
            { label: 'Products Listed', value: products.length, icon: '🏷️', color: 'var(--primary)' },
            { label: 'Store Rating', value: `${stats?.rating || 0} ★`, icon: '⭐', color: 'var(--primary)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex" style={{ marginBottom: '0.4rem' }}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span><span className="stat-label">{s.label}</span></div>
              <div className="stat-value" style={{ color: s.color, fontSize: '1.4rem' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Products */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">🏷️ My Products ({products.length})</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? '✕ Cancel' : '+ Add Product'}
            </button>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--primary)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>➕ New Product</h3>
              <form onSubmit={handleAddProduct}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" className="form-control" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input type="number" className="form-control" step="0.01" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                      <option>Hardware</option><option>Mining Equipment</option><option>Educational</option><option>Software</option><option>Accessories</option><option>Services</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" className="form-control" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: parseInt(e.target.value) }))} min={1} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Describe your product..." required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : '✓ Submit for Review'}</button>
              </form>
            </div>
          )}

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Price</th><th>Stock</th><th>Orders</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex" style={{ gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{p.emoji || '📦'}</span>
                        <span style={{ fontWeight: 700 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${p.price}</td>
                    <td>{p.stock}</td>
                    <td>{p.orders}</td>
                    <td>
                      <span className={`badge badge-${p.status === 'active' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}`}>{p.status}</span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p._id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders to Fulfill */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><span className="card-title">📦 Orders to Fulfill</span></div>
          {orders.filter(o => o.status === 'pending').length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}><p>No pending orders</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Order</th><th>Buyer</th><th>Product</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>#{o._id.slice(-6).toUpperCase()}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.buyer}</td>
                      <td>{o.product}</td>
                      <td style={{ fontWeight: 700 }}>${o.amount}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.date}</td>
                      <td><span className={`badge badge-${o.status === 'completed' || o.status === 'fulfilled' ? 'success' : 'warning'}`}>{o.status}</span></td>
                      <td>
                        {o.status === 'pending' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleFulfill(o._id)}>Mark Fulfilled</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">💸 Payout Information</span></div>
          <div className="grid-2">
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Available Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>${(stats?.revenue * 0.93 || 0).toFixed(2)}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>After 7% platform commission</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Payout Schedule</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text)' }}>Every Monday for previous week's sales</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Request Payout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
