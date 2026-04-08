import React, { useState } from 'react';

const INITIAL_PROMOS = [
  { id: 1, code: 'FREEMINER10', discount: 10, validFrom: '2024-01-01', validTo: '2024-02-29', tiers: ['basic', 'advanced'], uses: 847, limit: 1000, active: true },
  { id: 2, code: 'PREMIUM50', discount: 50, validFrom: '2024-01-15', validTo: '2024-01-31', tiers: ['premium'], uses: 213, limit: 500, active: true },
  { id: 3, code: 'NEWUSER25', discount: 25, validFrom: '2024-01-01', validTo: '2024-03-31', tiers: ['basic', 'advanced', 'premium'], uses: 1024, limit: 2000, active: false },
];

const ALL_TIERS = ['basic', 'advanced', 'premium'];
const TIER_COLORS = { basic: '#3b82f6', advanced: '#8b5cf6', premium: '#ffd700' };

function AdminPromotions() {
  const [promos, setPromos] = useState(INITIAL_PROMOS);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ code: '', discount: '', validFrom: '', validTo: '', tiers: [], maxUses: '' });
  const [formError, setFormError] = useState('');
  const [editForm, setEditForm] = useState(null);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleToggleActive = (id) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleDeletePromo = (id) => {
    setPromos(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
    showSuccess('Promotion deleted successfully.');
  };

  const handleTierToggle = (tier, formObj, setFormObj) => {
    setFormObj(prev => ({
      ...prev,
      tiers: prev.tiers.includes(tier) ? prev.tiers.filter(t => t !== tier) : [...prev.tiers, tier],
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.code.trim()) { setFormError('Promo code is required.'); return; }
    if (!form.discount || isNaN(form.discount) || parseFloat(form.discount) <= 0 || parseFloat(form.discount) > 100) { setFormError('Discount must be 1–100%.'); return; }
    if (!form.validFrom || !form.validTo) { setFormError('Please set valid dates.'); return; }
    if (form.validTo < form.validFrom) { setFormError('End date must be after start date.'); return; }
    if (form.tiers.length === 0) { setFormError('Select at least one tier.'); return; }
    if (!form.maxUses || isNaN(form.maxUses) || parseInt(form.maxUses) <= 0) { setFormError('Max uses must be a positive number.'); return; }
    if (promos.some(p => p.code.toUpperCase() === form.code.toUpperCase())) { setFormError('A promo with this code already exists.'); return; }

    const newPromo = {
      id: Date.now(),
      code: form.code.toUpperCase().trim(),
      discount: parseFloat(form.discount),
      validFrom: form.validFrom,
      validTo: form.validTo,
      tiers: form.tiers,
      uses: 0,
      limit: parseInt(form.maxUses),
      active: true,
    };
    setPromos(prev => [newPromo, ...prev]);
    setForm({ code: '', discount: '', validFrom: '', validTo: '', tiers: [], maxUses: '' });
    showSuccess(`Promotion "${newPromo.code}" created successfully.`);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    setPromos(prev => prev.map(p => p.id === editId ? { ...p, ...editForm } : p));
    setEditId(null);
    setEditForm(null);
    showSuccess('Promotion updated successfully.');
  };

  const startEdit = (promo) => {
    setEditId(promo.id);
    setEditForm({ ...promo });
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  };

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    color: '#a0a0b0',
    fontSize: '0.78rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '80px 20px 60px', color: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>🏷️ Promotions Manager</h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Create and manage discount codes</p>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)', color: '#00d4aa', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: '600' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Active Promotions Table */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>Active Promotions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  {['Code', 'Discount', 'Valid From', 'Valid To', 'Tiers', 'Usage', 'Active', 'Actions'].map(h => (
                    <th key={h} style={{ color: '#a0a0b0', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => (
                  <tr key={promo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', fontWeight: '800', fontSize: '0.9rem', color: '#f7931a', letterSpacing: '0.5px' }}>{promo.code}</td>
                    <td style={{ padding: '12px', color: '#00d4aa', fontWeight: '700' }}>{promo.discount}%</td>
                    <td style={{ padding: '12px', color: '#888', fontSize: '0.83rem' }}>{promo.validFrom}</td>
                    <td style={{ padding: '12px', color: '#888', fontSize: '0.83rem' }}>{promo.validTo}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {promo.tiers.map(t => (
                          <span key={t} style={{ background: `${TIER_COLORS[t]}22`, border: `1px solid ${TIER_COLORS[t]}55`, color: TIER_COLORS[t], padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ marginBottom: '4px', fontSize: '0.82rem', color: '#d0d0e0' }}>{promo.uses} / {promo.limit}</div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (promo.uses / promo.limit) * 100)}%`, background: promo.uses / promo.limit > 0.8 ? '#ff4757' : '#00d4aa', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleToggleActive(promo.id)}
                        style={{ background: promo.active ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${promo.active ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.15)'}`, color: promo.active ? '#00d4aa' : '#888', padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {promo.active ? '● ON' : '○ OFF'}
                      </button>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => startEdit(promo)} style={{ background: 'rgba(247,147,26,0.12)', border: '1px solid rgba(247,147,26,0.3)', color: '#f7931a', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => setDeleteConfirm(promo.id)} style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '0.9rem' }}>No promotions yet. Create one below.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Promotion Form */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '24px' }}>➕ Create New Promotion</h2>
          {formError && (
            <div style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.88rem' }}>
              ⚠️ {formError}
            </div>
          )}
          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Promo Code</label>
                <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" style={{ ...inputStyle, width: '100%', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={labelStyle}>Discount %</label>
                <input type="number" min="1" max="100" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} placeholder="25" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input type="date" value={form.validFrom} onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input type="date" value={form.validTo} onChange={e => setForm(p => ({ ...p, validTo: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={labelStyle}>Max Uses</label>
                <input type="number" min="1" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="1000" style={{ ...inputStyle, width: '100%' }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Applicable Tiers</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                {ALL_TIERS.map(tier => (
                  <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', background: form.tiers.includes(tier) ? `${TIER_COLORS[tier]}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${form.tiers.includes(tier) ? TIER_COLORS[tier] : 'rgba(255,255,255,0.12)'}`, transition: 'all 0.2s ease' }}>
                    <input type="checkbox" checked={form.tiers.includes(tier)} onChange={() => handleTierToggle(tier, form, setForm)} style={{ accentColor: TIER_COLORS[tier], width: '14px', height: '14px' }} />
                    <span style={{ color: form.tiers.includes(tier) ? TIER_COLORS[tier] : '#a0a0b0', fontWeight: '600', fontSize: '0.85rem', textTransform: 'capitalize' }}>{tier}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" style={{ background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '13px 32px', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}>
              CREATE PROMOTION
            </button>
          </form>
        </div>

        {/* Edit Modal */}
        {editId && editForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={() => { setEditId(null); setEditForm(null); }}
          >
            <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '36px', minWidth: '360px', maxWidth: '500px', width: '90%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px' }}>✏️ Edit Promotion: {editForm.code}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Discount %</label>
                  <input type="number" min="1" max="100" value={editForm.discount} onChange={e => setEditForm(p => ({ ...p, discount: parseFloat(e.target.value) }))} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Max Uses</label>
                  <input type="number" min="1" value={editForm.limit} onChange={e => setEditForm(p => ({ ...p, limit: parseInt(e.target.value) }))} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={editForm.validFrom} onChange={e => setEditForm(p => ({ ...p, validFrom: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" value={editForm.validTo} onChange={e => setEditForm(p => ({ ...p, validTo: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Applicable Tiers</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {ALL_TIERS.map(tier => (
                    <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: '7px 12px', borderRadius: '8px', background: editForm.tiers.includes(tier) ? `${TIER_COLORS[tier]}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${editForm.tiers.includes(tier) ? TIER_COLORS[tier] : 'rgba(255,255,255,0.12)'}` }}>
                      <input type="checkbox" checked={editForm.tiers.includes(tier)} onChange={() => handleTierToggle(tier, editForm, setEditForm)} style={{ accentColor: TIER_COLORS[tier] }} />
                      <span style={{ color: editForm.tiers.includes(tier) ? TIER_COLORS[tier] : '#a0a0b0', fontWeight: '600', fontSize: '0.82rem', textTransform: 'capitalize' }}>{tier}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleEditSave} style={{ flex: 1, background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Save Changes</button>
                <button onClick={() => { setEditId(null); setEditForm(null); }} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: '#a0a0b0', padding: '12px', borderRadius: '10px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm !== null && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={() => setDeleteConfirm(null)}
          >
            <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '20px', padding: '36px', minWidth: '320px', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🗑️</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Delete Promotion?</h3>
              <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '24px' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleDeletePromo(deleteConfirm)} style={{ flex: 1, background: 'linear-gradient(135deg, #ff4757, #d63031)', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Delete</button>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: '#a0a0b0', padding: '12px', borderRadius: '10px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminPromotions;
