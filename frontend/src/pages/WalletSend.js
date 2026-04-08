import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { wallet as api } from '../services/api';

const CURRENCIES = ['BTC', 'ETH', 'LTC', 'XMR', 'USDT', 'USDC', 'USD'];

export default function WalletSend() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    recipient: '',
    currency: searchParams.get('currency') || 'BTC',
    amount: '',
    note: '',
  });
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api.getBalances()
      .then(d => setBalances(d.balances || []))
      .catch(() => {});
  }, []);

  const currentBalance = balances.find(b => b.currency === form.currency);
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.recipient) { setError('Please enter a recipient.'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setError('');
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.send(form);
      setSuccess(`✓ Successfully sent ${form.amount} ${form.currency} to ${form.recipient}`);
      setConfirming(false);
    } catch (err) {
      setError(err.message || 'Transfer failed. Check your balance and try again.');
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/wallet">Wallet</Link>
          <span className="sep">›</span>
          <span className="current">Send</span>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h1>💸 Send Payment</h1>
            <p>Transfer crypto or funds to another user</p>
          </div>

          {success ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ marginBottom: '0.5rem' }}>Payment Sent!</h2>
              <div className="alert alert-success" style={{ textAlign: 'left' }}>{success}</div>
              <div className="flex" style={{ gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <Link to="/wallet" className="btn btn-outline">← Back to Wallet</Link>
                <button className="btn btn-primary" onClick={() => { setSuccess(''); setForm(f => ({ ...f, recipient: '', amount: '', note: '' })); }}>
                  Send Another
                </button>
              </div>
            </div>
          ) : confirming ? (
            <div className="card">
              <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>⚠️ Confirm Transfer</h2>
              <div className="flex-col" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  ['To', form.recipient],
                  ['Amount', `${form.amount} ${form.currency}`],
                  ['Note', form.note || '(none)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex-between" style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <div className="flex" style={{ gap: '0.75rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirming(false)} disabled={loading}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirm} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending...</> : '✓ Confirm Send'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              {error && <div className="alert alert-error">⚠️ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Currency</label>
                  <select className="form-control" name="currency" value={form.currency} onChange={handleChange}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {currentBalance && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Available: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{currentBalance.amount} {form.currency}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Recipient <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(email or wallet address)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="recipient"
                    placeholder="user@example.com or 1A2B3C..."
                    value={form.recipient}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="form-control"
                      name="amount"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={handleChange}
                      step="any"
                      min="0"
                      required
                      style={{ paddingRight: '3.5rem' }}
                    />
                    <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                      {form.currency}
                    </span>
                  </div>
                  {currentBalance && form.amount && (
                    <button type="button" className="btn btn-sm" style={{ marginTop: '0.4rem', fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(245,158,11,0.1)', color: 'var(--primary)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4 }}
                      onClick={() => setForm(f => ({ ...f, amount: currentBalance.amount }))}>
                      Max: {currentBalance.amount}
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Note / Memo <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="note"
                    placeholder="e.g. Payment for invoice #123"
                    value={form.note}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '0.5rem' }}>
                  Review Transfer →
                </button>
              </form>

              <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                💡 Double-check the recipient address before confirming. Crypto transactions cannot be reversed.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
