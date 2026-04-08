import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';

export default function PromoCodesPanel() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discountType: 'percentage', discountValue: '', maxUses: '', validUntil: '', isActive: true });

  const fetchPromos = () => {
    setLoading(true);
    adminAPI.getPromoCodes().then(res => setPromos(res.data.promos)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createPromoCode({ ...form, discountValue: +form.discountValue, maxUses: form.maxUses ? +form.maxUses : null });
      setMsg({ type: 'success', text: '✅ Promo code created.' });
      setShowModal(false);
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', maxUses: '', validUntil: '', isActive: true });
      fetchPromos();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await adminAPI.deletePromoCode(id);
      setMsg({ type: 'success', text: '✅ Deleted.' });
      fetchPromos();
    } catch (err) {
      setMsg({ type: 'error', text: 'Delete failed.' });
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await adminAPI.updatePromoCode(id, { isActive: !isActive });
      fetchPromos();
    } catch (err) {
      setMsg({ type: 'error', text: 'Update failed.' });
    }
  };

  return (
    <div>
      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}<button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button></div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Create Promo Code</button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-blue)', fontSize: 14 }}>{p.code}</td>
                    <td><span className="badge badge-purple">{p.discountType}</span></td>
                    <td style={{ fontWeight: 700 }}>{p.discountType === 'percentage' ? `${p.discountValue}%` : `$${p.discountValue}`}</td>
                    <td>{p.usedCount}{p.maxUses ? `/${p.maxUses}` : '/∞'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.validUntil ? new Date(p.validUntil).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <label className="toggle" style={{ display: 'inline-flex' }}>
                        <input type="checkbox" checked={p.isActive} onChange={() => handleToggle(p._id, p.isActive)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {promos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 14 }}>No promo codes yet.</p>}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">➕ Create Promo Code</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input className="form-input" placeholder="SAVE20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="20% off first deposit" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Value</label>
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="20" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Max Uses (blank = unlimited)</label>
                  <input className="form-input" type="number" min="1" placeholder="100" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input className="form-input" type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>✅ Create</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
