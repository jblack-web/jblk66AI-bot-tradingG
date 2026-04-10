import React, { useState, useEffect, useCallback } from 'react';
import { legalAPI } from '../utils/api';

const DOC_TYPES = [
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'privacy_policy', label: 'Privacy Policy' },
  { value: 'disclosure', label: 'Disclosure' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'cookie_policy', label: 'Cookie Policy' },
  { value: 'other', label: 'Other' },
];

const STAGE_TYPES = [
  { value: 'review', label: '🔍 Review', color: '#3B82F6' },
  { value: 'approval', label: '✅ Approval', color: '#10B981' },
  { value: 'dispute', label: '⚠️ Dispute', color: '#F59E0B' },
  { value: 'escalation', label: '🚨 Escalation', color: '#EF4444' },
  { value: 'resolution', label: '🎯 Resolution', color: '#8B5CF6' },
];

const STATUS_COLORS = {
  draft: '#F59E0B',
  published: '#10B981',
  archived: '#64748B',
  active: '#3B82F6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

const STATUS_ICONS = { draft: '✏️', published: '✅', archived: '📦' };

function StatusBadge({ status }) {
  return (
    <span style={{
      display: 'inline-block',
      background: STATUS_COLORS[status] ? STATUS_COLORS[status] + '22' : '#64748B22',
      color: STATUS_COLORS[status] || '#64748B',
      border: `1px solid ${STATUS_COLORS[status] || '#64748B'}44`,
      borderRadius: 6,
      padding: '2px 10px',
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {STATUS_ICONS[status] || ''} {status}
    </span>
  );
}

function Alert({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
      {msg.text}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
    </div>
  );
}

// ─── Document Editor Modal ──────────────────────────────────────────────────
function DocumentEditor({ doc, workflows, onSave, onClose }) {
  const [form, setForm] = useState({
    title: doc?.title || '',
    type: doc?.type || 'terms_of_service',
    description: doc?.description || '',
    content: doc?.currentContent || '',
    changeNote: '',
    tags: (doc?.tags || []).join(', '),
    effectiveDate: doc?.effectiveDate ? doc.effectiveDate.substring(0, 10) : '',
    notifyUsersOnPublish: doc?.notifyUsersOnPublish !== false,
    requiresWorkflow: doc?.requiresWorkflow || false,
    workflowId: doc?.workflowId?._id || doc?.workflowId || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        effectiveDate: form.effectiveDate || undefined,
        workflowId: form.workflowId || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{doc ? '✏️ Edit Document' : '📄 New Legal Document'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Document Type *</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Content</label>
              <textarea
                className="form-input"
                style={{ height: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Enter the full legal document content here..."
              />
            </div>
            {doc && (
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Change Note (for version history)</label>
                <input className="form-input" value={form.changeNote} onChange={e => setForm(f => ({ ...f, changeNote: e.target.value }))} placeholder="What changed in this version?" />
              </div>
            )}
            <div>
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="legal, compliance, users" />
            </div>
            <div>
              <label className="form-label">Effective Date</label>
              <input className="form-input" type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Approval Workflow</label>
              <select className="form-input" value={form.workflowId} onChange={e => setForm(f => ({ ...f, workflowId: e.target.value }))}>
                <option value="">— None —</option>
                {workflows.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.notifyUsersOnPublish} onChange={e => setForm(f => ({ ...f, notifyUsersOnPublish: e.target.checked }))} />
                Notify users on publish
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.requiresWorkflow} onChange={e => setForm(f => ({ ...f, requiresWorkflow: e.target.checked }))} />
                Requires workflow approval
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : '💾 Save Document'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Workflow Builder Modal ─────────────────────────────────────────────────
function WorkflowBuilder({ workflow, onSave, onClose }) {
  const [form, setForm] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    isDefault: workflow?.isDefault || false,
    stages: workflow?.stages || [],
  });
  const [saving, setSaving] = useState(false);

  const addStage = () => setForm(f => ({
    ...f,
    stages: [...f.stages, {
      name: '',
      type: 'review',
      order: f.stages.length,
      description: '',
      durationDays: 3,
      requiresApproval: false,
      notifyOnEntry: true,
      notifyOnExit: true,
    }],
  }));

  const removeStage = (i) => setForm(f => ({ ...f, stages: f.stages.filter((_, idx) => idx !== i) }));

  const updateStage = (i, field, value) => setForm(f => {
    const stages = [...f.stages];
    stages[i] = { ...stages[i], [field]: value };
    return { ...f, stages };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, stages: form.stages.map((s, i) => ({ ...s, order: i })) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{workflow ? '✏️ Edit Workflow' : '🔧 New Workflow'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label className="form-label">Workflow Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, paddingBottom: 10 }}>
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                Set as default workflow
              </label>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Stages ({form.stages.length})</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={addStage}>+ Add Stage</button>
          </div>

          {form.stages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
              No stages yet. Click "Add Stage" to build your workflow.
            </div>
          )}

          {form.stages.map((stage, i) => {
            const stageTypeMeta = STAGE_TYPES.find(t => t.value === stage.type);
            return (
              <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `4px solid ${stageTypeMeta?.color || '#64748B'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Stage {i + 1}</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeStage(i)}>🗑️ Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 12 }}>Stage Name *</label>
                    <input className="form-input" style={{ fontSize: 13 }} value={stage.name} onChange={e => updateStage(i, 'name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 12 }}>Stage Type</label>
                    <select className="form-input" style={{ fontSize: 13 }} value={stage.type} onChange={e => updateStage(i, 'type', e.target.value)}>
                      {STAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 12 }}>Duration (days)</label>
                    <input className="form-input" style={{ fontSize: 13 }} type="number" min={1} value={stage.durationDays} onChange={e => updateStage(i, 'durationDays', +e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Description</label>
                    <input className="form-input" style={{ fontSize: 13 }} value={stage.description} onChange={e => updateStage(i, 'description', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={stage.requiresApproval} onChange={e => updateStage(i, 'requiresApproval', e.target.checked)} />
                      Requires Approval
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={stage.notifyOnEntry} onChange={e => updateStage(i, 'notifyOnEntry', e.target.checked)} />
                      Notify on Entry
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={stage.notifyOnExit} onChange={e => updateStage(i, 'notifyOnExit', e.target.checked)} />
                      Notify on Exit
                    </label>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || form.stages.length === 0}>
              {saving ? 'Saving…' : '💾 Save Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Document Version History ───────────────────────────────────────────────
function VersionHistory({ doc, onClose }) {
  const versions = [...(doc.versions || [])].reverse();
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>📋 Version History — {doc.title}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        {versions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No version history yet.</p>}
        {versions.map((v, i) => (
          <div key={v._id || i} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, marginBottom: 12, borderLeft: `4px solid ${STATUS_COLORS[v.status] || '#64748B'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>v{v.versionNumber}</span>
              <StatusBadge status={v.status} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              By {v.changedByName || 'System'} · {v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'}
            </div>
            {v.changeNote && <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{v.changeNote}"</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main LegalPanel ────────────────────────────────────────────────────────
export default function LegalPanel() {
  const [tab, setTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [docModal, setDocModal] = useState(null); // null | 'new' | doc object
  const [wfModal, setWfModal] = useState(null); // null | 'new' | workflow object
  const [historyDoc, setHistoryDoc] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, wfsRes, statsRes] = await Promise.all([
        legalAPI.getDocuments(),
        legalAPI.getWorkflows(),
        legalAPI.getStats(),
      ]);
      setDocuments(docsRes.data.documents || []);
      setWorkflows(wfsRes.data.workflows || []);
      setStats(statsRes.data.stats || null);
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Failed to load legal data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveDoc = async (formData) => {
    try {
      if (docModal === 'new') {
        await legalAPI.createDocument(formData);
        showMsg('success', 'Document created successfully.');
      } else {
        await legalAPI.updateDocument(docModal._id, formData);
        showMsg('success', 'Document updated successfully.');
      }
      setDocModal(null);
      load();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Save failed.');
    }
  };

  const handleStatusChange = async (doc, status) => {
    try {
      await legalAPI.changeDocumentStatus(doc._id, status);
      showMsg('success', `Document ${status} successfully.`);
      load();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Status change failed.');
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await legalAPI.deleteDocument(doc._id);
      showMsg('success', 'Document deleted.');
      load();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Delete failed.');
    }
  };

  const handleSaveWorkflow = async (formData) => {
    try {
      if (wfModal === 'new') {
        await legalAPI.createWorkflow(formData);
        showMsg('success', 'Workflow created.');
      } else {
        await legalAPI.updateWorkflow(wfModal._id, formData);
        showMsg('success', 'Workflow updated.');
      }
      setWfModal(null);
      load();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Save failed.');
    }
  };

  const handleDeleteWorkflow = async (wf) => {
    if (!window.confirm(`Delete workflow "${wf.name}"?`)) return;
    try {
      await legalAPI.deleteWorkflow(wf._id);
      showMsg('success', 'Workflow deleted.');
      load();
    } catch (e) {
      showMsg('error', 'Delete failed.');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const tabStyle = (active) => ({
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: active ? 'var(--accent-blue)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  });

  return (
    <div>
      {/* Modals */}
      {(docModal === 'new' || (docModal && typeof docModal === 'object')) && (
        <DocumentEditor
          doc={docModal === 'new' ? null : docModal}
          workflows={workflows}
          onSave={handleSaveDoc}
          onClose={() => setDocModal(null)}
        />
      )}
      {(wfModal === 'new' || (wfModal && typeof wfModal === 'object')) && (
        <WorkflowBuilder
          workflow={wfModal === 'new' ? null : wfModal}
          onSave={handleSaveWorkflow}
          onClose={() => setWfModal(null)}
        />
      )}
      {historyDoc && (
        <VersionHistory doc={historyDoc} onClose={() => setHistoryDoc(null)} />
      )}

      <Alert msg={msg} onClose={() => setMsg(null)} />

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Documents', value: stats.totalDocs, icon: '📄', color: '#3B82F6' },
            { label: 'Published', value: stats.publishedDocs, icon: '✅', color: '#10B981' },
            { label: 'Drafts', value: stats.draftDocs, icon: '✏️', color: '#F59E0B' },
            { label: 'Archived', value: stats.archivedDocs, icon: '📦', color: '#64748B' },
            { label: 'Workflows', value: stats.activeWorkflows, icon: '🔧', color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, marginBottom: 24, width: 'fit-content' }}>
        <button style={tabStyle(tab === 'documents')} onClick={() => setTab('documents')}>📄 Documents</button>
        <button style={tabStyle(tab === 'workflows')} onClick={() => setTab('workflows')}>🔧 Workflows</button>
      </div>

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Legal Documents</h3>
            <button className="btn btn-primary" onClick={() => setDocModal('new')}>+ New Document</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['Document', 'Type', 'Version', 'Status', 'Last Updated', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr key={doc._id} style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title}</div>
                      {doc.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{doc.description.substring(0, 60)}{doc.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>
                      {DOC_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>v{doc.currentVersion}</td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={doc.status} /></td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setDocModal(doc)}>✏️</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setHistoryDoc(doc)} title="Version History">📋</button>
                        {doc.status !== 'published' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(doc, 'published')}>Publish</button>
                        )}
                        {doc.status === 'published' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(doc, 'archived')}>Archive</button>
                        )}
                        {doc.status !== 'draft' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(doc, 'draft')}>Draft</button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteDoc(doc)} style={{ color: 'var(--danger)' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No legal documents yet. Click "New Document" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {tab === 'workflows' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Legal Workflows</h3>
            <button className="btn btn-primary" onClick={() => setWfModal('new')}>+ New Workflow</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {workflows.map(wf => (
              <div key={wf._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>{wf.name}</div>
                    {wf.isDefault && <span style={{ display: 'inline-block', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginTop: 4 }}>DEFAULT</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setWfModal(wf)}>✏️</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteWorkflow(wf)} style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                </div>
                {wf.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{wf.description}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(wf.stages || []).map((stage, i) => {
                    const meta = STAGE_TYPES.find(t => t.value === stage.type);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: meta?.color || '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontWeight: 600 }}>{stage.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({meta?.label || stage.type})</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{stage.durationDays}d</span>
                      </div>
                    );
                  })}
                  {(wf.stages || []).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No stages defined.</div>}
                </div>
              </div>
            ))}
            {workflows.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 48, gridColumn: '1/-1' }}>
                <p style={{ color: 'var(--text-muted)' }}>No workflows yet. Click "New Workflow" to build one.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
