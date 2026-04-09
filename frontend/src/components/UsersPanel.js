import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../utils/api';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [creditForm, setCreditForm] = useState({ userId: null, amount: '', type: 'wallet', note: '' });
  const [showCreditModal, setShowCreditModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 20, search, tier });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, tier, search]);

  const fetchManagers = async () => {
    try {
      const res = await adminAPI.getManagers();
      setManagers(res.data.managers || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchManagers(); }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => { e.preventDefault(); fetchUsers(); };

  const handleUpdate = async (id, field, value) => {
    try {
      await adminAPI.updateUser(id, { [field]: value });
      setMsg({ type: 'success', text: `✅ User updated.` });
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      country: user.country || '',
      adminNote: user.adminNote || '',
      role: user.role || 'user',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateUser(editUser._id, editForm);
      setMsg({ type: 'success', text: `✅ User ${editUser.username} updated.` });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.creditUser(creditForm.userId, { amount: +creditForm.amount, type: creditForm.type, note: creditForm.note });
      setMsg({ type: 'success', text: `✅ ${creditForm.type} credited $${creditForm.amount}.` });
      setShowCreditModal(false);
      setCreditForm({ userId: null, amount: '', type: 'wallet', note: '' });
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Credit failed.' });
    }
  };

  const formatLastLogin = (date) => {
    if (!date) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Never</span>;
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return <span style={{ color: 'var(--accent-green)', fontSize: 11 }}>Just now</span>;
    if (diffMins < 60) return <span style={{ color: 'var(--accent-green)', fontSize: 11 }}>{diffMins}m ago</span>;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{diffHours}h ago</span>;
    return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.toLocaleDateString()}</span>;
  };

  return (
    <div>
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
            <input className="form-input" placeholder="Search by username or email..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary">🔍 Search</button>
          </form>
          <select className="form-select" value={tier} onChange={e => { setTier(e.target.value); setPage(1); }} style={{ width: 150 }}>
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="advanced">Advanced</option>
            <option value="premium">Premium</option>
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{total} users</span>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Tier</th>
                  <th>Wallet</th>
                  <th>Savings</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Agent</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{u.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: 12, width: 120 }}
                        value={u.currentTier || 'free'}
                        onChange={e => handleUpdate(u._id, 'currentTier', e.target.value)}
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="advanced">Advanced</option>
                        <option value="premium">Premium</option>
                      </select>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>${(u.walletBalance || 0).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>${(u.savingsBalance || 0).toFixed(2)}</td>
                    <td>
                      <label className="toggle-wrapper" style={{ cursor: 'pointer' }}>
                        <label className="toggle" style={{ width: 36, height: 18 }}>
                          <input type="checkbox" checked={u.isActive}
                            onChange={e => handleUpdate(u._id, 'isActive', e.target.checked)} />
                          <span className="toggle-slider" />
                        </label>
                        <span style={{ fontSize: 11, color: u.isActive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </label>
                    </td>
                    <td>{formatLastLogin(u.lastLoginAt)}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: 12, width: 140 }}
                        value={u.accountManagerId?._id || ''}
                        onChange={e => handleUpdate(u._id, 'accountManagerId', e.target.value === '' ? null : e.target.value)}
                      >
                        <option value="">— None —</option>
                        {managers.map(m => (
                          <option key={m._id} value={m._id}>{m.displayName}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(u)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => { setCreditForm({ userId: u._id, amount: '', type: 'wallet', note: `Credit for ${u.username}` }); setShowCreditModal(true); }}
                        >
                          💰 Credit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 14 }}>No users found.</p>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {page} of {Math.ceil(total / 20)}</span>
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}>Next →</button>
          </div>
        )}
      </div>

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">💰 Credit User</h2>
              <button className="modal-close" onClick={() => setShowCreditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCredit}>
              <div className="form-group">
                <label className="form-label">Credit Type</label>
                <select className="form-select" value={creditForm.type} onChange={e => setCreditForm({ ...creditForm, type: e.target.value })}>
                  <option value="wallet">Wallet Balance</option>
                  <option value="savings">Savings Balance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (USD)</label>
                <input type="number" className="form-input" min="0.01" step="0.01" placeholder="100.00"
                  value={creditForm.amount} onChange={e => setCreditForm({ ...creditForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <input type="text" className="form-input" placeholder="Reason for credit..."
                  value={creditForm.note} onChange={e => setCreditForm({ ...creditForm, note: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>✅ Credit</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreditModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit User — {editUser.username}</h2>
              <button className="modal-close" onClick={() => setEditUser(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" placeholder="First name"
                    value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" placeholder="Last name"
                    value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="user@example.com"
                  value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" placeholder="+1 555 000 0000"
                    value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input type="text" className="form-input" placeholder="US"
                    value={editForm.country} onChange={e => setEditForm({ ...editForm, country: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Note</label>
                <input type="text" className="form-input" placeholder="Internal note about this user..."
                  value={editForm.adminNote} onChange={e => setEditForm({ ...editForm, adminNote: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>💾 Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
