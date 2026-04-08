import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { marketplace as api } from '../services/api';

const MOCK_CART = {
  items: [
    { _id: '1', productId: '1', name: 'Antminer S19 Pro 110TH/s', price: 2499.99, quantity: 1, emoji: '⛏️' },
    { _id: '2', productId: '3', name: 'Bitcoin Mining Masterclass', price: 49.99, quantity: 2, emoji: '📚' },
  ],
};

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [applying, setApplying] = useState(false);
  const [updating, setUpdating] = useState(null);

  const loadCart = () => {
    api.getCart()
      .then(data => setCart(data.cart || data))
      .catch(() => setCart(MOCK_CART))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCart(); }, []);

  const updateQty = async (itemId, qty) => {
    if (qty < 1) return handleRemove(itemId);
    setUpdating(itemId);
    try {
      await api.updateCart(itemId, { quantity: qty });
      setCart(c => ({ ...c, items: c.items.map(i => i._id === itemId ? { ...i, quantity: qty } : i) }));
    } catch { loadCart(); }
    finally { setUpdating(null); }
  };

  const handleRemove = async (itemId) => {
    setUpdating(itemId);
    try {
      await api.removeFromCart(itemId);
      setCart(c => ({ ...c, items: c.items.filter(i => i._id !== itemId) }));
    } catch { loadCart(); }
    finally { setUpdating(null); }
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    try {
      const data = await api.applyCoupon(coupon.trim());
      setDiscount(data.discount || 0);
      setCouponMsg(`✓ Coupon applied! ${data.discount}% off`);
    } catch {
      setCouponMsg('Invalid or expired coupon code');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const discountAmt = subtotal * (discount / 100);
  const tax = (subtotal - discountAmt) * 0.08;
  const total = subtotal - discountAmt + tax;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>🛒 Shopping Cart</h1>
          <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        {items.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Browse our marketplace to find products</p>
              <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Marketplace</Link>
            </div>
          </div>
        ) : (
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Cart Items */}
            <div>
              <div className="card">
                <div className="card-header"><span className="card-title">Cart Items</span></div>
                <div className="flex-col">
                  {items.map(item => (
                    <div key={item._id} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 8, opacity: updating === item._id ? 0.6 : 1 }}>
                      <div style={{ fontSize: '2.5rem', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card2)', borderRadius: 8 }}>
                        {item.emoji || '📦'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{item.name}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, marginBottom: '0.5rem' }}>${(item.price * item.quantity).toFixed(2)}</div>
                        <div className="flex" style={{ gap: '0.5rem' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => updateQty(item._id, item.quantity - 1)} disabled={updating === item._id}>−</button>
                          <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                          <button className="btn btn-outline btn-sm" onClick={() => updateQty(item._id, item.quantity + 1)} disabled={updating === item._id}>+</button>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginLeft: '0.25rem' }}>× ${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemove(item._id)} disabled={updating === item._id} style={{ alignSelf: 'flex-start' }}>
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon */}
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header" style={{ marginBottom: '0.75rem' }}><span className="card-title">🎟 Coupon Code</span></div>
                {couponMsg && <div className={`alert ${couponMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{couponMsg}</div>}
                <div className="flex" style={{ gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter coupon code"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button className="btn btn-secondary" onClick={handleApplyCoupon} disabled={applying}>
                    {applying ? '...' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="card">
              <div className="card-header"><span className="card-title">📋 Order Summary</span></div>
              <div className="flex-col" style={{ gap: '0.65rem', marginBottom: '1.25rem' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex-between">
                    <span style={{ color: 'var(--success)' }}>Discount ({discount}%)</span>
                    <span style={{ color: 'var(--success)' }}>−${discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="divider" style={{ margin: '0.25rem 0' }} />
                <div className="flex-between">
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/checkout')}>
                🔒 Proceed to Checkout
              </button>
              <Link to="/marketplace" className="btn btn-outline btn-full" style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                ← Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
