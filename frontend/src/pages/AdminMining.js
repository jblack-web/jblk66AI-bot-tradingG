import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as api } from '../services/api';

const MOCK_RIGS = [
  { _id: 'r1', name: 'Bitcoin Miner Alpha', hashrate: 110, type: 'ASIC', algorithm: 'SHA-256', location: 'Iceland', status: 'online', contracts: 12, pricePerDay: 33.00 },
  { _id: 'r2', name: 'ETH GPU Farm Beta', hashrate: 320, type: 'GPU', algorithm: 'Ethash', location: 'Canada', status: 'online', contracts: 8, pricePerDay: 96.00 },
  { _id: 'r3', name: 'Industrial BTC Farm', hashrate: 1200, type: 'ASIC', algorithm: 'SHA-256', location: 'Texas', status: 'maintenance', contracts: 0, pricePerDay: 240.00 },
  { _id: 'r4', name: 'GPU Cluster Delta', hashrate: 560, type: 'GPU', algorithm: 'Ethash', location: 'Norway', status: 'online', contracts: 6, pricePerDay: 140.00 },
];

export default function AdminMining() {
  const [rigs, setRigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRig, setNewRig] = useState({ name: '', hashrate: '', type: 'ASIC', algorithm: 'SHA-256', location: '', pricePerDay: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [stats, setStats] = useState({ totalContracts: 26, totalHashrate: 2190, dailyEarnings: 509 });

  useEffect(() => {
    api.getMiningRigs()
      .then(d => setRigs(d.rigs || MOCK_RIGS))
      .catch(() => setRigs(MOCK_RIGS))
      .finally(() => setLoading(false));
  }, []);

  const handleAddRig = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createRig(newRig);
      setRigs(r => [...r, res.rig || { ...newRig, _id: Date.now().toString(), status: 'online', contracts: 0 }]);
      setShowAddForm(false);
      setNewRig({ name: '', hashrate: '', type: 'ASIC', algorithm: 'SHA-256', location: '', pricePerDay: '' });
      setMsg('✓ Rig added successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to add rig'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (rigId, currentStatus) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    try {
      await api.updateRig(rigId, { status: newStatus });
      setRigs(rs => rs.map(r => r._id === rigId ? { ...r, status: newStatus } : r));
      setMsg(`✓ Rig status updated to ${newStatus}`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Error: ' + (err.message || 'Failed to update'));
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="sep">›</span>
          <span className="current">Mining</span>
        </div>
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>⛏️ Mining Management</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage rigs, contracts and mining stats</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕ Cancel' : '+ Add New Rig'}
          </button>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Contracts', value: stats.totalContracts, icon: '📋' },
            { label: 'Total Hashrate', value: `${stats.totalHashrate} TH/s`, icon: '⚡' },
            { label: 'Est. Daily Earnings', value: `$${stats.dailyEarnings}`, icon: '💰' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex" style={{ marginBottom: '0.4rem' }}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span><span className="stat-label">{s.label}</span></div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Add Rig Form */}
        {showAddForm && (
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--primary)' }}>
            <div className="card-header"><span className="card-title">➕ Add New Mining Rig</span></div>
            <form onSubmit={handleAddRig}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Rig Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Bitcoin Miner Pro" value={newRig.name} onChange={e => setNewRig(r => ({ ...r, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Hashrate (TH/s)</label>
                  <input type="number" className="form-control" placeholder="110" value={newRig.hashrate} onChange={e => setNewRig(r => ({ ...r, hashrate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-control" value={newRig.type} onChange={e => setNewRig(r => ({ ...r, type: e.target.value }))}>
                    <option>ASIC</option><option>GPU</option><option>CPU</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Algorithm</label>
                  <select className="form-control" value={newRig.algorithm} onChange={e => setNewRig(r => ({ ...r, algorithm: e.target.value }))}>
                    <option>SHA-256</option><option>Ethash</option><option>Scrypt</option><option>RandomX</option><option>KawPow</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" className="form-control" placeholder="e.g. Iceland" value={newRig.location} onChange={e => setNewRig(r => ({ ...r, location: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Price Per Day ($)</label>
                  <input type="number" className="form-control" placeholder="33.00" step="0.01" value={newRig.pricePerDay} onChange={e => setNewRig(r => ({ ...r, pricePerDay: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '✓ Add Rig'}
              </button>
            </form>
          </div>
        )}

        {/* Rigs Table */}
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rig Name</th>
                    <th>Hashrate</th>
                    <th>Type</th>
                    <th>Algorithm</th>
                    <th>Location</th>
                    <th>$/Day</th>
                    <th>Contracts</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rigs.map(rig => (
                    <tr key={rig._id}>
                      <td style={{ fontWeight: 700 }}>{rig.name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{rig.hashrate} TH/s</td>
                      <td><span className="badge badge-muted">{rig.type}</span></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rig.algorithm}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {rig.location}</td>
                      <td style={{ fontWeight: 700 }}>${rig.pricePerDay}</td>
                      <td>{rig.contracts}</td>
                      <td>
                        <span className={`badge badge-${rig.status === 'online' ? 'success' : rig.status === 'maintenance' ? 'warning' : 'danger'}`}>
                          {rig.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${rig.status === 'online' ? 'btn-outline' : 'btn-success'}`}
                          onClick={() => handleStatusToggle(rig._id, rig.status)}
                        >
                          {rig.status === 'online' ? 'Take Offline' : 'Bring Online'}
                        </button>
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
