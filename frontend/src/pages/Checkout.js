import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplace as api, wallet as walletApi } from '../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet_usd');
  const [address, setAddress] = useState({ name: '', street: '', city: '', state: '', zip: '', country: 'US' });

  useEffect(() => {
    Promise.all([
      api.getCart().catch(() => ({ items: [] })),
      walletApi.getBalances().catch(() => ({ balances: [] })),
    ]).then(([c, b]) => {
      setCart(c.cart || c);
      setBalances(b.balances || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleAddrChange = e => setAddress(a => ({ ...a, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async e => {
    e.preventDefault();
    if (!address.name || !address.street || !address.city) { setError('Please fill in all required shipping fields.'); return; }
    setPlacing(true);
    setError('');
    try {
      const res = await api.checkout({ shippingAddress: address, paymentMethod });
      navigate(`/orders/${res.orderId || res.order?._id || 'success'}`);
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const usdBalance = balances.find(b => b.currency === 'USD')?.amount || '0.00';
  const usdtBalance = balances.find(b => b.currency === 'USDT')?.amount || '0.00';

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>🔒 Checkout</h1>
          <p>Review your order and complete payment</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Left: Address + Payment */}
            <div className="flex-col">
              <div className="card">
                <div className="card-header"><span className="card-title">📦 Shipping Address</span></div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" className="form-control" name="name" value={address.name} onChange={handleAddrChange} required placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Street Address *</label>
                  <input type="text" className="form-control" name="street" value={address.street} onChange={handleAddrChange} required placeholder="123 Main St" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>City *</label>
                    <input type="text" className="form-control" name="city" value={address.city} onChange={handleAddrChange} required placeholder="New York" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" className="form-control" name="state" value={address.state} onChange={handleAddrChange} placeholder="NY" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input type="text" className="form-control" name="zip" value={address.zip} onChange={handleAddrChange} placeholder="10001" />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <select className="form-control" name="country" value={address.country} onChange={handleAddrChange}>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">💳 Payment Method</span></div>
                {[
                  { value: 'wallet_usd', label: '💵 USD Balance', sub: `Available: $${usdBalance}` },
                  { value: 'wallet_usdt', label: '₮ USDT Balance', sub: `Available: ${usdtBalance} USDT` },
                  { value: 'wallet_btc', label: '₿ Bitcoin (BTC)', sub: 'Pay with your BTC wallet balance' },
                  { value: 'wallet_eth', label: 'Ξ Ethereum (ETH)', sub: 'Pay with your ETH wallet balance' },
                ].map(pm => (
                  <label key={pm.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: 8, border: `1px solid ${paymentMethod === pm.value ? 'var(--primary)' : 'var(--border)'}`, background: paymentMethod === pm.value ? 'rgba(245,158,11,0.08)' : 'var(--bg)', marginBottom: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value={pm.value} checked={paymentMethod === pm.value} onChange={() => setPaymentMethod(pm.value)} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{pm.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{pm.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Right: Summary */}
            <div className="card">
              <div className="card-header"><span className="card-title">📋 Order Summary</span></div>
              <div className="flex-col" style={{ marginBottom: '1.25rem', gap: '0.5rem' }}>
                {items.map(item => (
                  <div key={item._id} className="flex-between" style={{ fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="divider" style={{ margin: '0.5rem 0' }} />
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="divider" style={{ margin: '0.5rem 0' }} />
                <div className="flex-between">
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={placing || items.length === 0}>
                {placing ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Placing Order...</> : '✅ Place Order'}
              </button>

              <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                🔒 Your payment is secured and encrypted. Funds are only deducted after order confirmation.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
