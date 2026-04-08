import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../utils/api';

export default function PaymentPanel() {
  const [tab, setTab] = useState('send');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);

  // Send form
  const [sendForm, setSendForm] = useState({ receiverEmail: '', amount: '', currency: 'USD', note: '' });
  // Receive form
  const [receiveForm, setReceiveForm] = useState({ amount: '', currency: 'USD', cryptoCurrency: 'USDT', paymentMethod: 'crypto' });
  // Wallet address
  const [walletAddr, setWalletAddr] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.adminGetAll({ limit: 30 });
      setPayments(res.data.payments);
      setPendingDeposits(res.data.payments.filter(p => p.type === 'deposit' && p.status === 'pending'));
      setPendingWithdrawals(res.data.payments.filter(p => p.type === 'withdrawal' && ['pending', 'processing'].includes(p.status)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await paymentAPI.send({ ...sendForm, amount: +sendForm.amount });
      setMsg({ type: 'success', text: `✅ Payment sent! TX: ${res.data.payment.transactionId}` });
      setSendForm({ receiverEmail: '', amount: '', currency: 'USD', note: '' });
      fetchPayments();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Payment failed.' });
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await paymentAPI.receive({ ...receiveForm, amount: +receiveForm.amount });
      setMsg({ type: 'success', text: `✅ Deposit request created! TX: ${res.data.payment.transactionId}` });
      const addrRes = await paymentAPI.getWalletAddress(receiveForm.cryptoCurrency);
      setWalletAddr(addrRes.data);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Request failed.' });
    }
  };

  const confirmDeposit = async (id) => {
    try {
      await paymentAPI.adminConfirmDeposit(id);
      setMsg({ type: 'success', text: '✅ Deposit confirmed and credited.' });
      fetchPayments();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error confirming deposit.' });
    }
  };

  const processWithdrawal = async (id, action) => {
    try {
      await paymentAPI.adminProcessWithdrawal(id, { action });
      setMsg({ type: 'success', text: `✅ Withdrawal ${action}d.` });
      fetchPayments();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error processing withdrawal.' });
    }
  };

  const statusBadge = (status) => {
    const map = { completed: 'badge-green', pending: 'badge-yellow', processing: 'badge-blue', failed: 'badge-red', cancelled: 'badge-gray' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
  };

  return (
    <div>
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Quick Action Alerts */}
      {pendingDeposits.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⏳ <strong>{pendingDeposits.length}</strong> pending deposit(s) awaiting confirmation
        </div>
      )}
      {pendingWithdrawals.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          💸 <strong>{pendingWithdrawals.length}</strong> withdrawal request(s) awaiting approval
        </div>
      )}

      <div className="payment-tabs">
        {[
          { id: 'send', label: '📤 Send Payment' },
          { id: 'receive', label: '📥 Receive Payment' },
          { id: 'pending', label: `⏳ Pending (${pendingDeposits.length + pendingWithdrawals.length})` },
          { id: 'history', label: '📋 Transaction History' },
        ].map(t => (
          <div key={t.id} className={`payment-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* SEND TAB */}
      {tab === 'send' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">📤 Send Payment</div>
            <form onSubmit={handleSend}>
              <div className="form-group">
                <label className="form-label">Receiver Email</label>
                <input className="form-input" type="email" placeholder="user@example.com" value={sendForm.receiverEmail}
                  onChange={e => setSendForm({ ...sendForm, receiverEmail: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (USD)</label>
                <input className="form-input" type="number" min="1" step="0.01" placeholder="100.00" value={sendForm.amount}
                  onChange={e => setSendForm({ ...sendForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={sendForm.currency} onChange={e => setSendForm({ ...sendForm, currency: e.target.value })}>
                  <option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" placeholder="Payment note..." value={sendForm.note}
                  onChange={e => setSendForm({ ...sendForm, note: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                📤 Send Payment
              </button>
            </form>
          </div>
          <div className="card">
            <div className="card-title">ℹ️ Payment Info</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>💱 <strong>Supported:</strong> USD, EUR, GBP</div>
              <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>💸 <strong>Fee:</strong> 0.5% of transaction amount</div>
              <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>⚡ <strong>Internal transfers:</strong> Instant</div>
              <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>🌐 <strong>External transfers:</strong> 1-3 business days</div>
              <div style={{ padding: '10px 0' }}>📋 <strong>Min amount:</strong> $1.00</div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE TAB */}
      {tab === 'receive' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">📥 Request Payment / Deposit</div>
            <form onSubmit={handleReceive}>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input className="form-input" type="number" min="1" step="0.01" placeholder="500.00" value={receiveForm.amount}
                  onChange={e => setReceiveForm({ ...receiveForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Cryptocurrency</label>
                <select className="form-select" value={receiveForm.cryptoCurrency} onChange={e => setReceiveForm({ ...receiveForm, cryptoCurrency: e.target.value })}>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="USDT">Tether (USDT)</option>
                  <option value="BNB">BNB Chain (BNB)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                📥 Generate Deposit Address
              </button>
            </form>

            {walletAddr && (
              <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>DEPOSIT ADDRESS ({walletAddr.currency})</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-green)', wordBreak: 'break-all', marginBottom: 12 }}>
                  {walletAddr.address}
                </div>
                {walletAddr.qrCode && (
                  <img src={walletAddr.qrCode} alt="QR Code" style={{ width: 120, height: 120 }} />
                )}
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: 12, color: 'var(--accent-yellow)' }}>
                  ⚠️ Only send {walletAddr.currency} to this address. Wrong asset = permanent loss.
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">💰 Supported Cryptocurrencies</div>
            {[
              { name: 'Bitcoin', symbol: 'BTC', icon: '₿', confirmations: 3, time: '~30 min' },
              { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', confirmations: 12, time: '~3 min' },
              { name: 'USDT (TRC20)', symbol: 'USDT', icon: '₮', confirmations: 20, time: '~1 min' },
              { name: 'BNB Chain', symbol: 'BNB', icon: '⬡', confirmations: 15, time: '~3 min' },
            ].map(c => (
              <div key={c.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 24, width: 36, textAlign: 'center' }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.confirmations} confirmations • {c.time}</div>
                  </div>
                </div>
                <span className="badge badge-green">{c.symbol}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING TAB */}
      {tab === 'pending' && (
        <div>
          {pendingDeposits.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title">📥 Pending Deposits ({pendingDeposits.length})</div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>TX ID</th><th>User</th><th>Amount</th><th>Currency</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pendingDeposits.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId?.slice(-12)}</td>
                        <td>{p.receiverEmail}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>${p.amount?.toFixed(2)}</td>
                        <td>{p.cryptoCurrency || p.currency}</td>
                        <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</td>
                        <td>
                          <button className="btn btn-success btn-sm" onClick={() => confirmDeposit(p._id)}>✅ Confirm</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pendingWithdrawals.length > 0 && (
            <div className="card">
              <div className="card-title">💸 Pending Withdrawals ({pendingWithdrawals.length})</div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>TX ID</th><th>User</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pendingWithdrawals.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId?.slice(-12)}</td>
                        <td>{p.senderEmail}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-red)' }}>${p.amount?.toFixed(2)}</td>
                        <td>{p.paymentMethod}</td>
                        <td>{statusBadge(p.status)}</td>
                        <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</td>
                        <td style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-success btn-sm" onClick={() => processWithdrawal(p._id, 'approve')}>✅</button>
                          <button className="btn btn-danger btn-sm" onClick={() => processWithdrawal(p._id, 'reject')}>❌</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pendingDeposits.length === 0 && pendingWithdrawals.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3>All clear!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No pending transactions.</p>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="card">
          <div className="card-title">📋 All Transactions</div>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>TX ID</th><th>Type</th><th>From/To</th><th>Amount</th><th>Fee</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId?.slice(-12) || 'N/A'}</td>
                      <td>
                        <span className={`badge ${p.type === 'deposit' ? 'badge-green' : p.type === 'withdrawal' ? 'badge-red' : p.type === 'send' ? 'badge-blue' : p.type === 'bonus' ? 'badge-purple' : 'badge-gray'}`}>
                          {p.type}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {p.sender?.username && <div>From: {p.sender.username}</div>}
                        {p.receiver?.username && <div>To: {p.receiver.username}</div>}
                        {!p.sender && !p.receiver && <span style={{ color: 'var(--text-muted)' }}>External</span>}
                      </td>
                      <td style={{ fontWeight: 600 }}>${p.amount?.toFixed(2)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>${(p.fee || 0).toFixed(2)}</td>
                      <td>{statusBadge(p.status)}</td>
                      <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 14 }}>No transactions yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
