import React, { useState, useEffect, useCallback } from 'react';
import { legalAPI } from '../utils/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', urgent: '#7c3aed', critical: '#dc2626' };
const SEVERITY_COLORS = { info: '#3b82f6', warning: '#f59e0b', critical: '#ef4444' };
const STATUS_COLORS = {
  pending: '#f59e0b', 'in-progress': '#3b82f6', 'awaiting-response': '#8b5cf6',
  resolved: '#10b981', closed: '#6b7280', escalated: '#ef4444',
  upcoming: '#3b82f6', completed: '#10b981', overdue: '#ef4444', cancelled: '#6b7280',
};

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, background: `${color}22`, color,
    }}>
      {text}
    </span>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, marginTop: 0 }}>{children}</h3>;
}

function useLegalMsg() {
  const [msg, setMsg] = useState(null);
  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };
  const MsgEl = msg ? (
    <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
      {msg.text}
      <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
    </div>
  ) : null;
  return { showMsg, MsgEl };
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

function LegalDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    legalAPI.getDashboard().then(r => setSummary(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!summary) return <p style={{ color: 'var(--text-muted)' }}>Failed to load legal dashboard.</p>;

  const { summary: s, recentTickets = [], urgentEvents = [] } = summary;

  const StatCard = ({ label, value, sub, color }) => (
    <div className="card" style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--accent-blue)' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* Stats row 1 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="Legal Team" value={s.team.total} sub={`${s.team.active} active`} />
        <StatCard label="Open Tickets" value={s.tickets.pending + s.tickets.inProgress} sub={`${s.tickets.pending} pending · ${s.tickets.inProgress} in-progress`} color="var(--accent-yellow)" />
        <StatCard label="Unread Alerts" value={s.alerts.unread} sub={`${s.alerts.critical} critical`} color={s.alerts.critical > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />
        <StatCard label="Documents" value={s.documents.total} sub={`${s.documents.published} published`} color="var(--accent-purple)" />
        <StatCard label="Upcoming Events" value={s.calendar.upcoming} sub={`${s.calendar.overdue} overdue`} color={s.calendar.overdue > 0 ? 'var(--accent-red)' : 'var(--accent-blue)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent tickets */}
        <div className="card">
          <SectionTitle>⚖️ Recent Tickets</SectionTitle>
          {recentTickets.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No tickets yet.</p> : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>#</th><th>Subject</th><th>Status</th><th>Priority</th></tr></thead>
                <tbody>
                  {recentTickets.map(t => (
                    <tr key={t._id}>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.ticketNumber}</td>
                      <td style={{ fontSize: 13 }}>{t.subject}</td>
                      <td><Badge text={t.status} color={STATUS_COLORS[t.status] || '#6b7280'} /></td>
                      <td><Badge text={t.priority} color={PRIORITY_COLORS[t.priority] || '#6b7280'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Urgent calendar events */}
        <div className="card">
          <SectionTitle>📅 Urgent Deadlines (Next 7 Days)</SectionTitle>
          {urgentEvents.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No urgent events.</p> : (
            <div>
              {urgentEvents.map(e => (
                <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.eventType}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge text={new Date(e.dueDate).toLocaleDateString()} color={PRIORITY_COLORS[e.priority] || '#6b7280'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team Members ─────────────────────────────────────────────────────────────

function TeamPanel() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '', role: 'in-house', organization: '', legalAreas: [], isActive: true });
  const { showMsg, MsgEl } = useLegalMsg();

  const fetch = useCallback(() => {
    setLoading(true);
    legalAPI.getTeam().then(r => setMembers(r.data.members || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const AREAS = ['compliance', 'kyc-aml', 'contracts', 'disputes', 'regulatory', 'data-privacy', 'intellectual-property', 'corporate', 'litigation', 'general'];

  const toggleArea = (area) => {
    setForm(f => ({ ...f, legalAreas: f.legalAreas.includes(area) ? f.legalAreas.filter(a => a !== area) : [...f.legalAreas, area] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await legalAPI.addTeamMember(form);
      showMsg('success', '✅ Team member added.');
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', title: '', role: 'in-house', organization: '', legalAreas: [], isActive: true });
      fetch();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleToggleActive = async (id, current) => {
    try {
      await legalAPI.updateTeamMember(id, { isActive: !current });
      fetch();
    } catch (err) {
      showMsg('error', 'Update failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this legal team member?')) return;
    try {
      await legalAPI.deleteTeamMember(id);
      showMsg('success', 'Member removed.');
      fetch();
    } catch (err) {
      showMsg('error', 'Delete failed.');
    }
  };

  const ROLE_COLORS = { admin: '#7c3aed', 'in-house': '#3b82f6', external: '#10b981' };

  return (
    <div>
      {MsgEl}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Team Member</button>
      </div>
      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Role</th><th>Legal Areas</th><th>Organization</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.title}</div>
                    </td>
                    <td><Badge text={m.role} color={ROLE_COLORS[m.role] || '#6b7280'} /></td>
                    <td style={{ maxWidth: 200 }}>
                      {(m.legalAreas || []).map(a => <Badge key={a} text={a} color="#6b7280" />).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' ', el], [])}
                    </td>
                    <td style={{ fontSize: 12 }}>{m.organization || '—'}</td>
                    <td>
                      <div style={{ fontSize: 12 }}>{m.email}</div>
                      {m.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.phone}</div>}
                    </td>
                    <td>
                      <label className="toggle" style={{ width: 36, height: 18 }}>
                        <input type="checkbox" checked={m.isActive} onChange={() => handleToggleActive(m._id, m.isActive)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(m._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No legal team members yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">➕ Add Legal Team Member</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Title / Position</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chief Legal Officer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="in-house">In-House Counsel</option>
                    <option value="external">External</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Organization</label>
                  <input className="form-input" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Legal Areas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AREAS.map(a => (
                    <button key={a} type="button"
                      onClick={() => toggleArea(a)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        background: form.legalAreas.includes(a) ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                        color: form.legalAreas.includes(a) ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >{a}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>✅ Add Member</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

function TicketsPanel() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ subject: '', description: '', category: 'general-inquiry', priority: 'medium' });
  const { showMsg, MsgEl } = useLegalMsg();

  const fetch = useCallback(() => {
    setLoading(true);
    legalAPI.getTickets({ status, priority, page, limit: 15 })
      .then(r => { setTickets(r.data.tickets || []); setTotal(r.data.total || 0); })
      .catch(console.error).finally(() => setLoading(false));
  }, [status, priority, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openTicket = async (id) => {
    try {
      const r = await legalAPI.getTicket(id);
      setSelected(r.data.ticket);
    } catch (err) {
      showMsg('error', 'Failed to load ticket.');
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await legalAPI.addTicketMessage(selected._id, { body: reply });
      setReply('');
      openTicket(selected._id);
    } catch (err) {
      showMsg('error', 'Failed to send reply.');
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await legalAPI.updateTicket(id, { status: newStatus });
      showMsg('success', `✅ Status updated to ${newStatus}.`);
      fetch();
      if (selected?._id === id) openTicket(id);
    } catch (err) {
      showMsg('error', 'Status update failed.');
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      await legalAPI.createTicket(createForm);
      showMsg('success', '✅ Ticket created.');
      setShowCreate(false);
      setCreateForm({ subject: '', description: '', category: 'general-inquiry', priority: 'medium' });
      fetch();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to create ticket.');
    }
  };

  const CATEGORIES = ['compliance', 'kyc-aml', 'contracts', 'disputes', 'regulatory', 'data-privacy', 'general-inquiry', 'document-request', 'other'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
      <div>
        {MsgEl}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 150 }}>
            <option value="">All Statuses</option>
            {['pending', 'in-progress', 'awaiting-response', 'resolved', 'closed', 'escalated'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select" value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} style={{ width: 130 }}>
            <option value="">All Priorities</option>
            {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>➕ New Ticket</button>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{total} tickets</span>
        </div>
        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /></div> : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>#</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t._id} style={{ cursor: 'pointer' }}>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.ticketNumber}</td>
                      <td style={{ fontSize: 13, fontWeight: 500 }} onClick={() => openTicket(t._id)}>{t.subject}</td>
                      <td style={{ fontSize: 12 }}>{t.category}</td>
                      <td><Badge text={t.priority} color={PRIORITY_COLORS[t.priority] || '#6b7280'} /></td>
                      <td><Badge text={t.status} color={STATUS_COLORS[t.status] || '#6b7280'} /></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openTicket(t._id)}>View</button>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No tickets found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {total > 15 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {page} of {Math.ceil(total / 15)}</span>
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="card" style={{ maxHeight: '80vh', overflow: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.ticketNumber}</div>
              <h3 style={{ margin: 0, fontSize: 15 }}>{selected.subject}</h3>
            </div>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <Badge text={selected.status} color={STATUS_COLORS[selected.status] || '#6b7280'} />
            <Badge text={selected.priority} color={PRIORITY_COLORS[selected.priority] || '#6b7280'} />
            <Badge text={selected.category} color="#6b7280" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, background: 'var(--bg-secondary)', borderRadius: 8, padding: 12 }}>
            {selected.description}
          </div>
          {/* Status change */}
          <div className="form-group">
            <label className="form-label">Change Status</label>
            <select className="form-select" value={selected.status} onChange={e => changeStatus(selected._id, e.target.value)}>
              {['pending', 'in-progress', 'awaiting-response', 'resolved', 'closed', 'escalated'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* Messages */}
          <SectionTitle>💬 Correspondence</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {(selected.messages || []).map((m, i) => (
              <div key={i} style={{
                background: m.isInternal ? 'rgba(139,92,246,0.08)' : 'var(--bg-secondary)',
                borderRadius: 8, padding: 10, border: m.isInternal ? '1px solid rgba(139,92,246,0.2)' : '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{m.senderName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({m.senderRole})</span></span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                {m.isInternal && <div style={{ fontSize: 10, color: '#8b5cf6', marginTop: 4 }}>🔒 Internal note</div>}
              </div>
            ))}
            {(!selected.messages || selected.messages.length === 0) && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No messages yet.</p>}
          </div>
          <div className="form-group">
            <textarea className="form-input" rows={3} placeholder="Write a reply..." value={reply} onChange={e => setReply(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={sendReply} disabled={!reply.trim()}>📨 Send Reply</button>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">📋 New Legal Ticket</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={createTicket}>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input className="form-input" required value={createForm.subject} onChange={e => setCreateForm({ ...createForm, subject: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={createForm.priority} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}>
                    {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={4} required value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>✅ Create Ticket</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Documents ────────────────────────────────────────────────────────────────

function DocumentsPanel() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', docType: 'terms', category: 'compliance', fileUrl: '', fileName: '', currentVersion: '1.0', accessLevel: 'admin-only', isPublished: false });
  const { showMsg, MsgEl } = useLegalMsg();

  const fetch = useCallback(() => {
    setLoading(true);
    legalAPI.getDocuments({ docType, page, limit: 15 })
      .then(r => { setDocs(r.data.documents || []); setTotal(r.data.total || 0); })
      .catch(console.error).finally(() => setLoading(false));
  }, [docType, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const DOC_TYPES = ['terms', 'privacy-policy', 'disclosure', 'risk-warning', 'license', 'filing', 'contract', 'audit-report', 'compliance-report', 'kyc-policy', 'aml-policy', 'data-request', 'regulatory', 'company-policy', 'other'];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await legalAPI.createDocument(form);
      showMsg('success', '✅ Document added to vault.');
      setShowCreate(false);
      setForm({ title: '', description: '', docType: 'terms', category: 'compliance', fileUrl: '', fileName: '', currentVersion: '1.0', accessLevel: 'admin-only', isPublished: false });
      fetch();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to add document.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await legalAPI.deleteDocument(id);
      showMsg('success', 'Document deleted.');
      fetch();
    } catch (err) {
      showMsg('error', 'Delete failed.');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const r = await legalAPI.downloadDocument(doc._id);
      if (r.data.fileUrl) window.open(r.data.fileUrl, '_blank');
    } catch (err) {
      showMsg('error', 'Download failed.');
    }
  };

  const ACCESS_COLORS = { 'admin-only': '#ef4444', 'legal-team': '#f59e0b', 'all-staff': '#3b82f6', public: '#10b981' };

  return (
    <div>
      {MsgEl}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="form-select" value={docType} onChange={e => { setDocType(e.target.value); setPage(1); }} style={{ width: 180 }}>
          <option value="">All Document Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>📄 Add Document</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{total} documents</span>
      </div>
      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Title</th><th>Type</th><th>Version</th><th>Access</th><th>Status</th><th>Updated</th><th>Downloads</th><th>Actions</th></tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{d.title}</div>
                      {d.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.description.substring(0, 60)}{d.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td style={{ fontSize: 12 }}>{d.docType}</td>
                    <td><span style={{ fontSize: 11, fontFamily: 'monospace' }}>v{d.currentVersion}</span></td>
                    <td><Badge text={d.accessLevel} color={ACCESS_COLORS[d.accessLevel] || '#6b7280'} /></td>
                    <td><Badge text={d.isPublished ? 'Published' : 'Draft'} color={d.isPublished ? '#10b981' : '#6b7280'} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(d.updatedAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.downloadCount}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {d.fileUrl && <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(d)}>⬇️</button>}
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(d._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No documents found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {total > 15 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {page} of {Math.ceil(total / 15)}</span>
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)}>Next →</button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title">📄 Add Legal Document</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Document Type *</label>
                  <select className="form-select" required value={form.docType} onChange={e => setForm({ ...form, docType: e.target.value })}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['compliance', 'kyc-aml', 'contracts', 'disputes', 'regulatory', 'data-privacy', 'corporate', 'internal', 'external'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Version</label>
                  <input className="form-input" value={form.currentVersion} onChange={e => setForm({ ...form, currentVersion: e.target.value })} placeholder="1.0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Access Level</label>
                  <select className="form-select" value={form.accessLevel} onChange={e => setForm({ ...form, accessLevel: e.target.value })}>
                    <option value="admin-only">Admin Only</option>
                    <option value="legal-team">Legal Team</option>
                    <option value="all-staff">All Staff</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">File URL (storage link)</label>
                <input className="form-input" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">File Name</label>
                <input className="form-input" value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} placeholder="document.pdf" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                <label htmlFor="isPublished" className="form-label" style={{ margin: 0 }}>Publish immediately</label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>✅ Add Document</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', alertType: 'regulatory-update', severity: 'info' });
  const { showMsg, MsgEl } = useLegalMsg();

  const fetch = useCallback(() => {
    setLoading(true);
    legalAPI.getAlerts({ severity, resolved: false })
      .then(r => { setAlerts(r.data.alerts || []); setTotal(r.data.total || 0); setUnread(r.data.unreadCount || 0); })
      .catch(console.error).finally(() => setLoading(false));
  }, [severity]);

  useEffect(() => { fetch(); }, [fetch]);

  const ALERT_TYPES = ['regulatory-update', 'kyc-trigger', 'aml-flag', 'suspicious-activity', 'compliance-deadline', 'audit-reminder', 'legal-change', 'data-request', 'sanction-hit', 'policy-change', 'other'];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await legalAPI.createAlert(form);
      showMsg('success', '✅ Alert created.');
      setShowCreate(false);
      setForm({ title: '', summary: '', alertType: 'regulatory-update', severity: 'info' });
      fetch();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to create alert.');
    }
  };

  const handleResolve = async (id) => {
    try {
      await legalAPI.resolveAlert(id, { resolutionNotes: 'Resolved by admin' });
      showMsg('success', 'Alert resolved.');
      fetch();
    } catch (err) {
      showMsg('error', 'Failed to resolve.');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await legalAPI.markAlertRead(id);
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {MsgEl}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-select" value={severity} onChange={e => setSeverity(e.target.value)} style={{ width: 140 }}>
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>🔔 New Alert</button>
        {unread > 0 && <span className="badge badge-red" style={{ marginLeft: 4 }}>{unread} unread</span>}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>{total} active alerts</span>
      </div>
      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map(a => (
              <div key={a._id} style={{
                padding: 14, borderRadius: 8,
                border: `1px solid ${!a.isRead ? SEVERITY_COLORS[a.severity] + '44' : 'var(--border-color)'}`,
                background: !a.isRead ? `${SEVERITY_COLORS[a.severity]}0a` : 'var(--bg-secondary)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Badge text={a.severity} color={SEVERITY_COLORS[a.severity] || '#6b7280'} />
                    <Badge text={a.alertType} color="#6b7280" />
                    {!a.isRead && <span style={{ fontSize: 10, color: 'var(--accent-blue)', fontWeight: 700 }}>● NEW</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{a.summary}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {!a.isRead && <button className="btn btn-secondary btn-sm" onClick={() => handleMarkRead(a._id)}>✓ Read</button>}
                  <button className="btn btn-success btn-sm" onClick={() => handleResolve(a._id)}>✅ Resolve</button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No active alerts.</p>}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">🔔 New Legal Alert</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Alert Type</label>
                  <select className="form-select" value={form.alertType} onChange={e => setForm({ ...form, alertType: e.target.value })}>
                    {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select className="form-select" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Summary *</label>
                <textarea className="form-input" rows={3} required value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>✅ Create Alert</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Compliance Calendar ──────────────────────────────────────────────────────

function CalendarPanel() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', eventType: 'filing-deadline', dueDate: '', priority: 'medium', notifyDaysBefore: 7 });
  const { showMsg, MsgEl } = useLegalMsg();

  const fetch = useCallback(() => {
    setLoading(true);
    legalAPI.getCalendar({ status })
      .then(r => { setEvents(r.data.events || []); setTotal(r.data.total || 0); })
      .catch(console.error).finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { fetch(); }, [fetch]);

  const EVENT_TYPES = ['filing-deadline', 'audit', 'eoy-reporting', 'review', 'kyc-renewal', 'license-renewal', 'regulatory-submission', 'board-meeting', 'compliance-training', 'data-retention-review', 'policy-review', 'other'];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await legalAPI.createEvent(form);
      showMsg('success', '✅ Compliance event added.');
      setShowCreate(false);
      setForm({ title: '', description: '', eventType: 'filing-deadline', dueDate: '', priority: 'medium', notifyDaysBefore: 7 });
      fetch();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to create event.');
    }
  };

  const handleComplete = async (id) => {
    try {
      await legalAPI.completeEvent(id, { completionNotes: 'Completed by admin' });
      showMsg('success', '✅ Event marked complete.');
      fetch();
    } catch (err) {
      showMsg('error', 'Failed to complete event.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this compliance event?')) return;
    try {
      await legalAPI.deleteEvent(id);
      showMsg('success', 'Event deleted.');
      fetch();
    } catch (err) {
      showMsg('error', 'Delete failed.');
    }
  };

  const daysUntil = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span style={{ color: 'var(--accent-red)', fontSize: 11 }}>Overdue by {Math.abs(diff)}d</span>;
    if (diff === 0) return <span style={{ color: 'var(--accent-red)', fontSize: 11 }}>Due today!</span>;
    if (diff <= 7) return <span style={{ color: 'var(--accent-yellow)', fontSize: 11 }}>In {diff} days</span>;
    return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(date).toLocaleDateString()}</span>;
  };

  return (
    <div>
      {MsgEl}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="form-select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 150 }}>
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>📅 Add Event</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{total} events</span>
      </div>
      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Title</th><th>Type</th><th>Priority</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {events.map(e => (
                  <tr key={e._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                      {e.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.description.substring(0, 60)}{e.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td style={{ fontSize: 12 }}>{e.eventType}</td>
                    <td><Badge text={e.priority} color={PRIORITY_COLORS[e.priority] || '#6b7280'} /></td>
                    <td>{daysUntil(e.dueDate)}</td>
                    <td><Badge text={e.status} color={STATUS_COLORS[e.status] || '#6b7280'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {e.status !== 'completed' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleComplete(e._id)}>✅</button>
                        )}
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(e._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No events found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">📅 Add Compliance Event</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select className="form-select" value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input className="form-input" type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notify Days Before</label>
                  <input className="form-input" type="number" min={1} max={90} value={form.notifyDaysBefore} onChange={e => setForm({ ...form, notifyDaysBefore: +e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>✅ Add Event</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

function AuditLogPanel() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState('');
  const [page, setPage] = useState(1);

  const fetch = useCallback(() => {
    setLoading(true);
    legalAPI.getAuditLog({ resource, page, limit: 25 })
      .then(r => { setLogs(r.data.logs || []); setTotal(r.data.total || 0); })
      .catch(console.error).finally(() => setLoading(false));
  }, [resource, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const SEVERITY_BADGE = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="form-select" value={resource} onChange={e => { setResource(e.target.value); setPage(1); }} style={{ width: 180 }}>
          <option value="">All Resources</option>
          <option value="LegalDocument">Documents</option>
          <option value="LegalTicket">Tickets</option>
          <option value="LegalTeamMember">Team</option>
          <option value="LegalAlert">Alerts</option>
          <option value="ComplianceCalendar">Calendar</option>
        </select>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{total} entries</span>
      </div>
      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Action</th><th>Resource</th><th>Performed By</th><th>Role</th><th>Severity</th><th>IP</th><th>Time</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id}>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{l.action}</td>
                    <td style={{ fontSize: 12 }}>
                      <div>{l.resource}</div>
                      {l.resourceTitle && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.resourceTitle}</div>}
                    </td>
                    <td style={{ fontSize: 12 }}>{l.performedByName || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.performedByRole || '—'}</td>
                    <td><Badge text={l.severity} color={SEVERITY_BADGE[l.severity] || '#6b7280'} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{l.ipAddress || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No audit log entries.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {total > 25 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {page} of {Math.ceil(total / 25)}</span>
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 25)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main LegalPanel ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'dashboard', label: '📊 Overview', component: LegalDashboard },
  { key: 'team', label: '👔 Team', component: TeamPanel },
  { key: 'tickets', label: '⚖️ Tickets', component: TicketsPanel },
  { key: 'documents', label: '📂 Documents', component: DocumentsPanel },
  { key: 'alerts', label: '🔔 Alerts', component: AlertsPanel },
  { key: 'calendar', label: '📅 Calendar', component: CalendarPanel },
  { key: 'audit', label: '🔍 Audit Log', component: AuditLogPanel },
];

export default function LegalPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const Tab = TABS.find(t => t.key === activeTab)?.component || LegalDashboard;

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 28 }}>⚖️</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Legal Team Management</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Compliance, documentation, ticketing, alerts, and audit trail — all in one hub.</p>
          </div>
        </div>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: activeTab === t.key ? 700 : 400,
                background: activeTab === t.key ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                color: activeTab === t.key ? '#fff' : 'var(--text-secondary)',
                border: '1px solid ' + (activeTab === t.key ? 'var(--accent-blue)' : 'var(--border-color)'),
                transition: 'all 0.15s',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Active Tab Content */}
      <Tab />
    </div>
  );
}
