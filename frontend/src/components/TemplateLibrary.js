import React, { useState, useEffect, useCallback } from 'react';
import { templateAPI } from '../utils/api';

const FRAMEWORKS = ['', 'react', 'vue', 'angular', 'svelte', 'html', 'solidjs', 'astro', 'remix'];
const UI_LIBS = ['', 'tailwind', 'bootstrap', 'material-ui', 'ant-design', 'chakra-ui', 'shadcn', 'custom'];
const STYLES = ['', 'modern', 'glassmorphism', 'neumorphism', 'flat', 'material', 'minimal', 'dark', 'light'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'downloadCount', label: 'Most Downloaded' },
  { value: 'averageRating', label: 'Top Rated' },
  { value: 'trendingScore', label: 'Trending' },
];

function StarRating({ rating }) {
  return (
    <span className="template-rating">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{rating?.toFixed(1)}</span>
    </span>
  );
}

function TemplateCard({ template, onPreview }) {
  return (
    <div className="template-card" onClick={() => onPreview(template)}>
      <div className="template-thumbnail">
        {template.thumbnailUrl ? (
          <img src={template.thumbnailUrl} alt={template.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
        ) : (
          <span>🎨</span>
        )}
        {template.isFeatured && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent-yellow)', color: '#1F2937', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
            ⭐ FEATURED
          </div>
        )}
        {template.isTrending && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent-red)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
            🔥 TRENDING
          </div>
        )}
      </div>
      <div className="template-info">
        <div className="template-title">{template.title}</div>
        <div className="template-meta">
          {template.framework && <span className="badge badge-blue">{template.framework}</span>}
          {template.uiLibrary && template.uiLibrary !== 'none' && <span className="badge badge-purple">{template.uiLibrary}</span>}
          {template.designStyle && <span className="badge badge-gray">{template.designStyle}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>
          {template.shortDescription || template.description?.slice(0, 80)}...
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="template-stats">
            <span>⬇️ {template.downloadCount?.toLocaleString()}</span>
            <span>👁️ {template.viewCount?.toLocaleString()}</span>
          </div>
          <div>
            <StarRating rating={template.averageRating} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>({template.reviewCount})</span>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: template.isFree ? 'var(--accent-green)' : 'var(--accent-yellow)', fontSize: 15 }}>
            {template.isFree ? 'FREE' : `$${template.price?.toFixed(2)}`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            📦 v{template.version}
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ template, onClose }) {
  if (!template) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{template.title}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {template.framework && <span className="badge badge-blue">{template.framework}</span>}
              {template.uiLibrary && <span className="badge badge-purple">{template.uiLibrary}</span>}
              {template.designStyle && <span className="badge badge-gray">{template.designStyle}</span>}
              <span className={`badge ${template.isFree ? 'badge-green' : 'badge-yellow'}`}>
                {template.isFree ? 'FREE' : `$${template.price?.toFixed(2)}`}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {template.thumbnailUrl && (
          <img
            src={template.thumbnailUrl}
            alt={template.title}
            style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 20 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}

        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          {template.description}
        </p>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>QUALITY SCORES</div>
            {[
              ['Code Quality', template.codeQuality],
              ['Performance', template.performanceScore],
              ['Accessibility', template.accessibilityScore],
            ].map(([label, score]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, width: 100, color: 'var(--text-secondary)' }}>{label}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 3 }}>
                  <div style={{ width: `${score}%`, height: '100%', background: score >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, width: 30 }}>{score}%</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>STATS</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>⬇️ {template.downloadCount?.toLocaleString()} downloads</div>
              <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>👁️ {template.viewCount?.toLocaleString()} views</div>
              <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>⭐ <StarRating rating={template.averageRating} /> ({template.reviewCount} reviews)</div>
              <div style={{ padding: '6px 0' }}>📦 Version {template.version}</div>
            </div>
          </div>
        </div>

        {template.componentCode && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>SOURCE CODE PREVIEW</div>
            <pre style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: 16,
              fontSize: 12,
              color: 'var(--accent-green)',
              overflow: 'auto',
              maxHeight: 200,
              lineHeight: 1.6,
            }}>
              {template.componentCode}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => templateAPI.download(template._id)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            ⬇️ Download Template
          </button>
          {template.demoUrl && (
            <a href={template.demoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
              🔗 Live Demo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [stats, setStats] = useState(null);

  const [filters, setFilters] = useState({
    search: '', category: '', framework: '', uiLibrary: '', designStyle: '',
    isFree: '', isFeatured: '', isTrending: '', sort: 'createdAt', order: 'desc',
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 24, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')) };
      const res = await templateAPI.getAll(params);
      setTemplates(res.data.templates);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    templateAPI.getCategories().then(res => setCategories(res.data.categories)).catch(console.error);
    templateAPI.getStats().then(res => setStats(res.data.stats)).catch(console.error);
  }, []);

  const setFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const totalPages = Math.ceil(total / 24);

  return (
    <div>
      {/* Stats Banner */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon">🎨</div>
          <div className="stat-value">{stats?.total?.toLocaleString() || '5000+'}</div>
          <div className="stat-label">Total Templates</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats?.totalDownloads?.toLocaleString() || '0'}</div>
          <div className="stat-label">Total Downloads</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📂</div>
          <div className="stat-value">12</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats?.featured || 0}</div>
          <div className="stat-label">Featured</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-panel">
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search templates by name, description, tags..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
            {filters.search && (
              <button onClick={() => setFilter('search', '')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
            )}
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-item">
            <label className="form-label">Category</label>
            <select className="form-select" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.icon} {c.name} ({c.templateCount})</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label">Framework</label>
            <select className="form-select" value={filters.framework} onChange={e => setFilter('framework', e.target.value)}>
              {FRAMEWORKS.map(f => <option key={f} value={f}>{f || 'All Frameworks'}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label">UI Library</label>
            <select className="form-select" value={filters.uiLibrary} onChange={e => setFilter('uiLibrary', e.target.value)}>
              {UI_LIBS.map(l => <option key={l} value={l}>{l || 'All Libraries'}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label">Design Style</label>
            <select className="form-select" value={filters.designStyle} onChange={e => setFilter('designStyle', e.target.value)}>
              {STYLES.map(s => <option key={s} value={s}>{s || 'All Styles'}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label">Pricing</label>
            <select className="form-select" value={filters.isFree} onChange={e => setFilter('isFree', e.target.value)}>
              <option value="">All</option>
              <option value="true">Free Only</option>
              <option value="false">Premium Only</option>
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label">Sort By</label>
            <select className="form-select" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={filters.isFeatured === 'true'} onChange={e => setFilter('isFeatured', e.target.checked ? 'true' : '')} />
            ⭐ Featured only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={filters.isTrending === 'true'} onChange={e => setFilter('isTrending', e.target.checked ? 'true' : '')} />
            🔥 Trending only
          </label>
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilters({ search: '', category: '', framework: '', uiLibrary: '', designStyle: '', isFree: '', isFeatured: '', isTrending: '', sort: 'createdAt', order: 'desc' }); setPage(1); }}>
            🔄 Reset Filters
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
            {total.toLocaleString()} templates found
          </span>
        </div>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : templates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <h3 style={{ marginBottom: 8 }}>No templates found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Try adjusting your filters or run the template seeder to populate the database.</p>
        </div>
      ) : (
        <>
          <div className="template-grid">
            {templates.map(t => (
              <TemplateCard key={t._id} template={t} onPreview={setPreviewTemplate} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              {totalPages > 5 && <span style={{ color: 'var(--text-muted)' }}>... {totalPages}</span>}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
    </div>
  );
}
