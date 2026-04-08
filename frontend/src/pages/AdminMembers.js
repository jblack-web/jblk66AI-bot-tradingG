import React, { useState } from 'react';

const TIER_COLORS = { free: '#888', basic: '#3b82f6', advanced: '#8b5cf6', premium: '#ffd700' };

const MOCK_MEMBERS = [
  { id: 1, name: 'John Smith', email: 'john@example.com', tier: 'premium', status: 'Active', joined: '2023-11-01', lastActive: '2024-01-15', earned: '$1,284' },
  { id: 2, name: 'Sarah Kim', email: 'sarah@example.com', tier: 'advanced', status: 'Active', joined: '2023-12-10', lastActive: '2024-01-15', earned: '$342' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', tier: 'basic', status: 'Active', joined: '2024-01-02', lastActive: '2024-01-14', earned: '$87' },
  { id: 4, name: 'Emma Brown', email: 'emma@example.com', tier: 'free', status: 'Trial', joined: '2024-01-10', lastActive: '2024-01-15', earned: '$12' },
  { id: 5, name: 'David Wilson', email: 'david@example.com', tier: 'premium', status: 'Active', joined: '2023-10-15', lastActive: '2024-01-15', earned: '$2,108' },
  { id: 6, name: 'Lisa Chen', email: 'lisa@example.com', tier: 'basic', status: 'Active', joined: '2023-12-20', lastActive: '2024-01-13', earned: '$54' },
  { id: 7, name: 'Tom Garcia', email: 'tom@example.com', tier: 'free', status: 'Trial', joined: '2024-01-12', lastActive: '2024-01-15', earned: '$6' },
  { id: 8, name: 'Anna Lee', email: 'anna@example.com', tier: 'advanced', status: 'Active', joined: '2023-11-25', lastActive: '2024-01-14', earned: '$198' },
  { id: 9, name: 'James Davis', email: 'james@example.com', tier: 'free', status: 'Suspended', joined: '2023-09-01', lastActive: '2023-12-30', earned: '$23' },
  { id: 10, name: 'Mary Taylor', email: 'mary@example.com', tier: 'basic', status: 'Active', joined: '2024-01-05', lastActive: '2024-01-15', earned: '$31' },
];

function AdminMembers() {
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [changeTierModal, setChangeTierModal] = useState(null);
  const [newTier, setNewTier] = useState('');
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [successMsg, setSuccessMsg] = useState('');

  const PAGE_SIZE = 5;

  const filtered = members.filter((m) => {
    if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && m.joined < dateFrom) return false;
    if (dateTo && m.joined > dateTo) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleChangeTier = () => {
    if (!newTier || !changeTierModal) return;
    setMembers(prev => prev.map(m => m.id === changeTierModal.id ? { ...m, tier: newTier } : m));
    setSuccessMsg(`Tier updated to ${newTier.toUpperCase()} for ${changeTierModal.name}`);
    setChangeTierModal(null);
    setNewTier('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExportCSV = () => {
    const header = 'Name,Email,Tier,Status,Joined,Last Active,Total Earned\n';
    const rows = filtered.map(m => `${m.name},${m.email},${m.tier},${m.status},${m.joined},${m.lastActive},${m.earned}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  };

  const inputStyle = {
    padding: '9px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '0.88rem',
    outline: 'none',
  };

  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '80px 20px 60px', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>👥 Members Management</h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>{filtered.length} members found</p>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)', color: '#00d4aa', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: '600' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Filters */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ color: '#a0a0b0', fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Tier</label>
              <select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1); }} style={selectStyle}>
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#a0a0b0', fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Status</label>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Trial">Trial</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#a0a0b0', fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>From</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#a0a0b0', fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>To</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ color: '#a0a0b0', fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Search</label>
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Name or email..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <button
              onClick={() => { setTierFilter('all'); setStatusFilter('all'); setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              style={{ padding: '9px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#a0a0b0', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', alignSelf: 'flex-end' }}
            >
              Reset
            </button>
            <button
              onClick={handleExportCSV}
              style={{ padding: '9px 18px', borderRadius: '8px', background: 'linear-gradient(135deg, #00d4aa, #00b894)', color: '#000', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', border: 'none', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
            >
              📥 EXPORT CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ ...cardStyle, marginBottom: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr>
                  {['#', 'Name', 'Email', 'Tier', 'Status', 'Joined', 'Last Active', 'Earned', 'Actions'].map(h => (
                    <th key={h} style={{ color: '#a0a0b0', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', color: '#666', fontSize: '0.82rem' }}>{m.id}</td>
                    <td style={{ padding: '12px', fontWeight: '600', fontSize: '0.9rem' }}>{m.name}</td>
                    <td style={{ padding: '12px', color: '#a0a0b0', fontSize: '0.85rem' }}>{m.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: `${TIER_COLORS[m.tier]}22`, border: `1px solid ${TIER_COLORS[m.tier]}55`, color: TIER_COLORS[m.tier], padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>{m.tier}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: m.status === 'Active' ? 'rgba(0,212,170,0.15)' : m.status === 'Trial' ? 'rgba(247,147,26,0.15)' : 'rgba(255,71,87,0.15)', color: m.status === 'Active' ? '#00d4aa' : m.status === 'Trial' ? '#f7931a' : '#ff4757', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{m.status}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#888', fontSize: '0.82rem' }}>{m.joined}</td>
                    <td style={{ padding: '12px', color: '#888', fontSize: '0.82rem' }}>{m.lastActive}</td>
                    <td style={{ padding: '12px', color: '#00d4aa', fontWeight: '700', fontSize: '0.88rem' }}>{m.earned}</td>
                    <td style={{ padding: '12px', position: 'relative' }}>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === m.id ? null : m.id)}
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 12px', borderRadius: '7px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Actions ▾
                      </button>
                      {openDropdown === m.id && (
                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% - 4px)', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px', minWidth: '160px', zIndex: 100, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
                          {[
                            { label: '👤 View Profile', action: () => setOpenDropdown(null) },
                            { label: '🔄 Change Tier', action: () => { setChangeTierModal(m); setNewTier(m.tier); setOpenDropdown(null); } },
                            { label: '⏰ Extend Trial', action: () => { alert(`Extended trial for ${m.name}`); setOpenDropdown(null); } },
                            { label: '📧 Send Email', action: () => { alert(`Email sent to ${m.email}`); setOpenDropdown(null); } },
                            { label: '🚫 Suspend', action: () => { setMembers(prev => prev.map(u => u.id === m.id ? { ...u, status: 'Suspended' } : u)); setOpenDropdown(null); } },
                          ].map(({ label, action }) => (
                            <button key={label} onClick={action} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', color: label.includes('Suspend') ? '#ff4757' : '#d0d0e0', fontSize: '0.83rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
                              onMouseLeave={e => e.target.style.background = 'none'}
                            >{label}</button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: page === 1 ? '#555' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>← Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: '8px 14px', borderRadius: '8px', background: page === p ? '#f7931a' : 'rgba(255,255,255,0.06)', border: `1px solid ${page === p ? '#f7931a' : 'rgba(255,255,255,0.12)'}`, color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: page === totalPages ? '#555' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Next →</button>
        </div>

        {/* Change Tier Modal */}
        {changeTierModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={() => setChangeTierModal(null)}
          >
            <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '36px', minWidth: '340px', maxWidth: '420px', width: '90%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Change Tier</h3>
              <p style={{ color: '#a0a0b0', fontSize: '0.88rem', marginBottom: '24px' }}>{changeTierModal.name} ({changeTierModal.email})</p>
              <select value={newTier} onChange={e => setNewTier(e.target.value)} style={{ ...selectStyle, width: '100%', marginBottom: '20px', padding: '12px 14px', boxSizing: 'border-box' }}>
                {['free', 'basic', 'advanced', 'premium'].map(t => <option key={t} value={t} style={{ background: '#1a1a2e' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleChangeTier} style={{ flex: 1, background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Save Changes</button>
                <button onClick={() => setChangeTierModal(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: '#a0a0b0', padding: '12px', borderRadius: '10px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminMembers;
