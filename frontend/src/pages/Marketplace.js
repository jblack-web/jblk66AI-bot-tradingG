import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { marketplace as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Mining Equipment', 'Hardware', 'Educational', 'Software', 'Accessories', 'Services'];

const MOCK_PRODUCTS = [
  { _id: '1', name: 'Antminer S19 Pro 110TH/s', price: 2499.99, category: 'Mining Equipment', rating: 4.8, reviews: 142, emoji: '⛏️' },
  { _id: '2', name: 'Nvidia RTX 4090 GPU', price: 1899.00, category: 'Hardware', rating: 4.9, reviews: 89, emoji: '🖥️' },
  { _id: '3', name: 'Bitcoin Mining Masterclass', price: 49.99, category: 'Educational', rating: 4.7, reviews: 312, emoji: '📚' },
  { _id: '4', name: 'Mining Pool Software Suite', price: 129.00, category: 'Software', rating: 4.5, reviews: 58, emoji: '💻' },
  { _id: '5', name: 'ASIC Cooling Fan Set (5-pack)', price: 89.99, category: 'Accessories', rating: 4.3, reviews: 204, emoji: '🌀' },
  { _id: '6', name: 'Whatsminer M50S 126TH/s', price: 3199.00, category: 'Mining Equipment', rating: 4.6, reviews: 77, emoji: '⛏️' },
  { _id: '7', name: 'Crypto Portfolio Tracker Pro', price: 19.99, category: 'Software', rating: 4.4, reviews: 523, emoji: '📊' },
  { _id: '8', name: 'Mining Rig Frame 8-GPU', price: 149.00, category: 'Accessories', rating: 4.2, reviews: 91, emoji: '🔧' },
  { _id: '9', name: 'DeFi Trading Strategy Course', price: 79.99, category: 'Educational', rating: 4.8, reviews: 189, emoji: '🎓' },
];

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [addingId, setAddingId] = useState(null);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category && category !== 'All') params.set('category', category);
    params.set('sort', sort);
    params.set('page', page);

    api.getProducts(`?${params.toString()}`)
      .then(data => setProducts(data.products || MOCK_PRODUCTS))
      .catch(() => setProducts(MOCK_PRODUCTS))
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  const filtered = products.filter(p => {
    if (minPrice && p.price < parseFloat(minPrice)) return false;
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;
    return true;
  });

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) { setCartMsg('Login to add to cart'); return; }
    setAddingId(productId);
    try {
      await api.addToCart({ productId, quantity: 1 });
      setCartMsg('Added to cart! ✓');
    } catch {
      setCartMsg('Failed to add to cart');
    } finally {
      setAddingId(null);
      setTimeout(() => setCartMsg(''), 3000);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>🛒 Marketplace</h1>
          <p>Browse mining equipment, hardware, courses and software</p>
        </div>

        {cartMsg && <div className={`alert ${cartMsg.includes('✓') ? 'alert-success' : 'alert-error'}`}>{cartMsg}</div>}

        <div className="sidebar-layout">
          {/* Sidebar Filters */}
          <aside>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem' }}>
                <span className="card-title" style={{ fontSize: '0.95rem' }}>🔍 Filters</span>
              </div>

              <div className="form-group">
                <label>Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setPage(1); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      background: category === cat ? 'rgba(245,158,11,0.15)' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      color: category === cat ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: category === cat ? 700 : 400,
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      marginBottom: '0.15rem',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label>Price Range</label>
                <div className="grid-2">
                  <input type="number" className="form-control" placeholder="Min $" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                  <input type="number" className="form-control" placeholder="Max $" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Sort By</label>
                <select className="form-control" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Best Rating</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
              </span>
              {isAuthenticated && <Link to="/cart" className="btn btn-outline btn-sm">🛒 View Cart</Link>}
            </div>

            {loading ? (
              <div className="loading-center"><div className="spinner spinner-lg" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map(product => (
                  <div key={product._id || product.id} className="product-card">
                    <div className="product-img">
                      {product.emoji || product.image || '📦'}
                    </div>
                    <div className="product-info">
                      <div style={{ marginBottom: '0.25rem' }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{product.category}</span>
                      </div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-rating">
                        <span style={{ color: 'var(--primary)' }}>{renderStars(product.rating || 0)}</span>
                        {' '}
                        <span style={{ color: 'var(--text-dim)' }}>({product.reviews || 0})</span>
                      </div>
                      <div className="product-price">${Number(product.price).toFixed(2)}</div>
                      <div className="flex" style={{ gap: '0.5rem' }}>
                        <Link to={`/marketplace/${product._id || product.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                          View
                        </Link>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          disabled={addingId === (product._id || product.id)}
                          onClick={() => handleAddToCart(product._id || product.id)}
                        >
                          {addingId === (product._id || product.id) ? '...' : '+ Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {[1, 2, 3].map(p => (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
