import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as api } from '../services/api';

const MOCK_USERS = [
  { _id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'user', kycStatus: 'verified', createdAt: '2024-01-05', active: true },
  { _id: 'u2', name: 'Bob Smith', email: 'bob@example.com', role: 'seller', kycStatus: 'pending', createdAt: '2024-01-08', active: true },
  { _id: 'u3', name: 'Carol White', email: 'carol@example.com', role: 'admin', kycStatus: 'verified', createdAt: '2023-12-01', active: true },
  { _id: 'u4', name: 'Dave Brown', email: 'dave@example.com', role: 'user', kycStatus: 'unverified', createdAt: '2024-01-12', active: false },
  { _id: 'u5', name: 'Eve Davis', email: 'eve@example.com', role: 'user', kycStatus: 'verified', createdAt: '2024-01-15', active: true },
  { _id: 'u6', name: 'Frank Wilson', email: 'frank@example.com', role: 'seller', kycStatus: 'verified', createdAt: '2024-01-18', active: true },
];

const ROLE_COLORS = { admin: 'primary', seller: 'secondary', user: 'muted' };
const KYC_COLORS = { verified: 'success', pending: 'warning', unverified: 'danger' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    api.getUsers()
      .then(d => setUsers(d.users || MOCK_USERS))
      .catch(() => setUsers(MOCK_USERS))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (userId, action, value) => {
    try {
      const updateData = {};
      if (action === 'suspend') updateData.active = false;
      if (action === 'activate') updateData.active = true;
      if (action === 'role') updateData.role = value;
      await api.updateUser(userId, updateData);
      setUsers(us => us.map(u => u._id === userId ? { ...u, ...updateData } : u));
      setActionMsg(`✓ User updated successfully`);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg('Error: ' + (err.message || 'Action failed'));
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="sep">›</span>
          <span className="current">Users</span>
        </div>
        <div className="page-header">
          <h1>👥 User Management</h1>
          <p>Manage platform users, roles, and verification</p>
        </div>

        {actionMsg && <div className={`alert ${actionMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{actionMsg}</div>}

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="flex-wrap" style={{ gap: '0.75rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 320 }}
            />
            <div className="flex" style={{ gap: '0.4rem' }}>
              {['all', 'admin', 'seller', 'user'].map(r => (
                <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRoleFilter(r)}>
                  {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>
              {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>KYC</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 600 }}>{user.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{user.email}</td>
                      <td>
                        <span className={`badge badge-${ROLE_COLORS[user.role] || 'muted'}`}>{user.role}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${KYC_COLORS[user.kycStatus] || 'muted'}`}>{user.kycStatus}</span>
                      </td>
                      <td>
                        <span className={`badge ${user.active !== false ? 'badge-success' : 'badge-danger'}`}>
                          {user.active !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex" style={{ gap: '0.4rem' }}>
                          {user.active !== false ? (
                            <button className="btn btn-danger btn-sm" onClick={() => handleAction(user._id, 'suspend')}>Suspend</button>
                          ) : (
                            <button className="btn btn-success btn-sm" onClick={() => handleAction(user._id, 'activate')}>Activate</button>
                          )}
                          <select
                            className="form-control"
                            style={{ height: 30, padding: '0 0.4rem', fontSize: '0.8rem', maxWidth: 100 }}
                            value={user.role}
                            onChange={e => handleAction(user._id, 'role', e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
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
