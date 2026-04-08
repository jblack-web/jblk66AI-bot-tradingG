import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marketplace as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MOCK_PRODUCT = {
  _id: '1',
  name: 'Antminer S19 Pro 110TH/s',
  price: 2499.99,
  category: 'Mining Equipment',
  rating: 4.8,
  reviews: 142,
  emoji: '⛏️',
  description: 'The Antminer S19 Pro is a high-performance SHA-256 mining machine delivering 110 TH/s with a power efficiency of 29.5 J/TH. Ideal for serious Bitcoin miners looking to maximize profitability.',
  specs: [
    { key: 'Hashrate', value: '110 TH/s ±3%' },
    { key: 'Power Consumption', value: '3245W ±5%' },
    { key: 'Power Efficiency', value: '29.5 J/TH' },
    { key: 'Operating Temperature', value: '5°C to 45°C' },
    { key: 'Network Connection', value: 'Ethernet' },
    { key: 'Dimensions', value: '400 x 195 x 290 mm' },
  ],
  reviews_list: [
    { user: 'CryptoMiner99', rating: 5, comment: 'Excellent machine, very efficient and runs quietly.', date: '2024-01-15' },
    { user: 'BlockchainBob', rating: 4, comment: 'Great performance but runs a bit hot. Get good cooling.', date: '2024-01-08' },
    { user: 'HashQueen', rating: 5, comment: 'Best investment I made this year. ROI in 8 months!', date: '2023-12-28' },
  ],
};

export default function ProductDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addMsg, setAddMsg] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.getProduct(id)
      .then(data => setProduct(data.product || data))
      .catch(() => setProduct({ ...MOCK_PRODUCT, _id: id }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async (redirect = false) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAdding(true);
    try {
      await api.addToCart({ productId: id, quantity });
      if (redirect) {
        navigate('/cart');
      } else {
        setAddMsg('Added to cart! ✓');
        setTimeout(() => setAddMsg(''), 3000);
      }
    } catch (err) {
      setAddMsg(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const renderStars = (r) => '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r));

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;
  if (!product) return <div className="page-wrapper"><div className="container"><div className="empty-state"><h3>Product not found</h3></div></div></div>;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/marketplace">Marketplace</Link>
          <span className="sep">›</span>
          <span className="current">{product.name}</span>
        </div>

        <div className="grid-2" style={{ marginBottom: '2rem', alignItems: 'start' }}>
          {/* Product Image */}
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>{product.emoji || '📦'}</div>
            <span className="badge badge-muted">{product.category}</span>
          </div>

          {/* Product Info */}
          <div>
            <div className="card">
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{product.name}</h1>
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{renderStars(product.rating || 0)}</span>
                {' '}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>({product.reviews || 0} reviews)</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>
                ${Number(product.price).toFixed(2)}
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                {product.description}
              </p>

              {addMsg && <div className={`alert ${addMsg.includes('✓') ? 'alert-success' : 'alert-error'}`}>{addMsg}</div>}

              <div className="form-group">
                <label>Quantity</label>
                <div className="flex" style={{ gap: '0.5rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                  <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{quantity}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>
              </div>

              <div className="flex" style={{ gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleAddToCart(false)} disabled={adding}>
                  {adding ? '...' : '🛒 Add to Cart'}
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleAddToCart(true)} disabled={adding}>
                  ⚡ Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specs && product.specs.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><span className="card-title">📋 Specifications</span></div>
            <div className="table-wrapper">
              <table className="table">
                <tbody>
                  {product.specs.map(s => (
                    <tr key={s.key}>
                      <td style={{ color: 'var(--text-muted)', width: '40%', fontWeight: 600 }}>{s.key}</td>
                      <td style={{ fontWeight: 500 }}>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="card">
          <div className="card-header"><span className="card-title">⭐ Customer Reviews</span></div>
          {(product.reviews_list || []).length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}><p>No reviews yet</p></div>
          ) : (
            <div className="flex-col">
              {(product.reviews_list || []).map((r, i) => (
                <div key={i} style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 8 }}>
                  <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700 }}>{r.user}</span>
                    <div className="flex" style={{ gap: '0.5rem' }}>
                      <span style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{renderStars(r.rating)}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{r.date}</span>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
