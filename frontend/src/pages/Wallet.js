import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wallet as api } from '../services/api';

const CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', icon: '₿', cls: 'btc' },
  { code: 'ETH', name: 'Ethereum', icon: 'Ξ', cls: 'eth' },
  { code: 'LTC', name: 'Litecoin', icon: 'Ł', cls: 'ltc' },
  { code: 'XMR', name: 'Monero', icon: 'ɱ', cls: 'xmr' },
  { code: 'USDT', name: 'Tether', icon: '₮', cls: 'usdt' },
  { code: 'USDC', name: 'USD Coin', icon: '$', cls: 'usdc' },
  { code: 'USD', name: 'US Dollar', icon: '$', cls: 'usd' },
];

const MOCK_BALANCES = [
  { currency: 'BTC', amount: '0.00241500', usdValue: 142.80 },
  { currency: 'ETH', amount: '0.18500000', usdValue: 487.50 },
  { currency: 'LTC', amount: '2.45000000', usdValue: 189.13 },
  { currency: 'XMR', amount: '1.20000000', usdValue: 228.00 },
  { currency: 'USDT', amount: '320.00', usdValue: 320.00 },
  { currency: 'USDC', amount: '150.00', usdValue: 150.00 },
  { currency: 'USD', amount: '1250.00', usdValue: 1250.00 },
];

const MOCK_TXS = [
  { _id: 't1', type: 'receive', currency: 'BTC', amount: '0.001', status: 'completed', createdAt: '2024-01-25', note: 'Mining payout' },
  { _id: 't2', type: 'send', currency: 'USDT', amount: '50.00', status: 'completed', createdAt: '2024-01-24', note: 'Marketplace payment' },
  { _id: 't3', type: 'deposit', currency: 'USD', amount: '500.00', status: 'completed', createdAt: '2024-01-23', note: 'Bank deposit' },
  { _id: 't4', type: 'withdraw', currency: 'ETH', amount: '0.05', status: 'pending', createdAt: '2024-01-22', note: 'Withdrawal to external wallet' },
  { _id: 't5', type: 'receive', currency: 'BTC', amount: '0.00086', status: 'completed', createdAt: '2024-01-21', note: 'Mining payout' },
  { _id: 't6', type: 'send', currency: 'BTC', amount: '0.0015', status: 'completed', createdAt: '2024-01-20', note: 'Transfer' },
];

const TX_ICONS = { send: '↑', receive: '↓', deposit: '＋', withdraw: '−', mining: '⛏', referral: '🔗' };
const TX_COLORS = { send: 'var(--danger)', receive: 'var(--success)', deposit: 'var(--success)', withdraw: 'var(--warning)', mining: 'var(--primary)', referral: 'var(--secondary)' };

export default function Wallet() {
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.getWallet().catch(() => ({ wallet: null })),
      api.getTransactions().catch(() => ({ transactions: MOCK_TXS })),
    ]).then(([w, t]) => {
      if (w.wallet?.balances) {
        const bal = Object.entries(w.wallet.balances).map(([code, amount]) => ({
          currency: code, amount: String(amount), usdValue: 0,
        }));
        setBalances(bal.length ? bal : MOCK_BALANCES);
      } else {
        setBalances(MOCK_BALANCES);
      }
      setTransactions(t.transactions || MOCK_TXS);
    }).finally(() => setLoading(false));
  }, []);

  const totalUsd = balances.reduce((s, b) => s + (b.usdValue || 0), 0);

  const filteredTxs = transactions.filter(tx => {
    if (txFilter !== 'all' && tx.type !== txFilter) return false;
    if (currencyFilter !== 'all' && tx.currency !== currencyFilter) return false;
    return true;
  });

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>💳 My Wallet</h1>
          <p>Manage your multi-currency balances</p>
        </div>

        {/* Total & Actions */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(59,130,246,0.05) 100%)', borderColor: 'rgba(245,158,11,0.25)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Total Portfolio Value</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>${totalUsd.toFixed(2)}</div>
            </div>
            <div className="flex-wrap" style={{ gap: '0.75rem' }}>
              <Link to="/wallet/send" className="btn btn-primary">💸 Send</Link>
              <Link to="/wallet/receive" className="btn btn-secondary">📥 Receive</Link>
              <button className="btn btn-outline" onClick={() => alert('Deposit feature: Use your wallet address to deposit crypto.')}>＋ Deposit</button>
              <button className="btn btn-outline" onClick={() => alert('Withdrawal will be processed according to current withdraw mode.')}>− Withdraw</button>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {balances.map(bal => {
            const curr = CURRENCIES.find(c => c.code === bal.currency) || {};
            return (
              <div key={bal.currency} className="wallet-card">
                <div className="wallet-currency">
                  <div className={`currency-icon currency-${(bal.currency || '').toLowerCase()}`}>
                    {curr.icon || bal.currency?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{bal.currency}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{curr.name}</div>
                  </div>
                </div>
                <div className="wallet-balance">{bal.amount}</div>
                <div className="wallet-usd-value">≈ ${(bal.usdValue || 0).toFixed(2)} USD</div>
                <div className="flex" style={{ gap: '0.4rem', marginTop: '0.75rem' }}>
                  <Link to={`/wallet/send?currency=${bal.currency}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>Send</Link>
                  <Link to={`/wallet/receive?currency=${bal.currency}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>Receive</Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transaction History */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📜 Transaction History</span>
          </div>

          {/* Filters */}
          <div className="flex-wrap" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
            {['all', 'send', 'receive', 'deposit', 'withdraw', 'mining'].map(f => (
              <button key={f} className={`btn btn-sm ${txFilter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTxFilter(f)}>
                {f === 'all' ? 'All Types' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <select className="form-control" style={{ maxWidth: 160, height: 32, padding: '0 0.5rem', fontSize: '0.82rem' }} value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)}>
              <option value="all">All Currencies</option>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>

          {filteredTxs.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-icon">📭</div>
              <h3>No transactions</h3>
              <p>Your transactions will appear here</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Note</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map(tx => (
                    <tr key={tx._id}>
                      <td>
                        <div className="flex" style={{ gap: '0.5rem' }}>
                          <span style={{ color: TX_COLORS[tx.type] || 'var(--text-muted)', fontWeight: 800, fontSize: '1rem' }}>
                            {TX_ICONS[tx.type] || '·'}
                          </span>
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{tx.type}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: ['receive', 'deposit', 'mining', 'referral'].includes(tx.type) ? 'var(--success)' : 'var(--text)' }}>
                        {['receive', 'deposit', 'mining', 'referral'].includes(tx.type) ? '+' : '-'}{tx.amount}
                      </td>
                      <td>
                        <span className="badge badge-muted">{tx.currency}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{tx.note || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge badge-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
