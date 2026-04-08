import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { wallet as api } from '../services/api';

const CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', min: '0.0001 BTC' },
  { code: 'ETH', name: 'Ethereum', min: '0.001 ETH' },
  { code: 'LTC', name: 'Litecoin', min: '0.01 LTC' },
  { code: 'XMR', name: 'Monero', min: '0.01 XMR' },
  { code: 'USDT', name: 'Tether', min: '10 USDT' },
  { code: 'USDC', name: 'USD Coin', min: '10 USDC' },
];

// Deterministic fake address generator from currency
function generateAddress(currency) {
  const prefixes = { BTC: '1', ETH: '0x', LTC: 'L', XMR: '4', USDT: '0x', USDC: '0x' };
  const chars = '0123456789abcdef';
  const len = currency === 'BTC' ? 33 : currency === 'LTC' ? 33 : 40;
  let addr = (prefixes[currency] || '1');
  // Simple deterministic pseudo-random from currency string
  let seed = currency.charCodeAt(0) * 7 + currency.length * 13;
  for (let i = addr.length; i < len; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    addr += chars[Math.abs(seed) % chars.length];
  }
  return addr;
}

// Fake QR grid (just visual, not real QR)
function QRPlaceholder({ address }) {
  const pattern = [];
  let seed = 0;
  for (let i = 0; i < address.length; i++) seed += address.charCodeAt(i);
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    pattern.push(Math.abs(seed) % 3 !== 0);
  }
  return (
    <div className="qr-placeholder">
      <div className="qr-grid">
        {pattern.map((filled, i) => (
          <div key={i} className="qr-cell" style={{ background: filled ? '#000' : '#fff' }} />
        ))}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#555' }}>Scan to pay</div>
    </div>
  );
}

export default function WalletReceive() {
  const [searchParams] = useSearchParams();
  const [currency, setCurrency] = useState(searchParams.get('currency') || 'BTC');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAddress(currency)
      .then(d => setAddress(d.address || generateAddress(currency)))
      .catch(() => setAddress(generateAddress(currency)))
      .finally(() => setLoading(false));
  }, [currency]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const currInfo = CURRENCIES.find(c => c.code === currency) || {};

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/wallet">Wallet</Link>
          <span className="sep">›</span>
          <span className="current">Receive</span>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h1>📥 Receive Payment</h1>
            <p>Share your address to receive crypto deposits</p>
          </div>

          <div className="card">
            <div className="form-group">
              <label>Select Currency</label>
              <div className="grid-3" style={{ gap: '0.5rem' }}>
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 8,
                      border: `1px solid ${currency === c.code ? 'var(--primary)' : 'var(--border)'}`,
                      background: currency === c.code ? 'rgba(245,158,11,0.1)' : 'var(--bg)',
                      color: currency === c.code ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: currency === c.code ? 700 : 500,
                      fontSize: '0.88rem',
                    }}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="loading-center" style={{ padding: '2rem' }}><div className="spinner" /></div>
            ) : (
              <>
                {/* QR Code */}
                <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                  <QRPlaceholder address={address} />
                </div>

                {/* Address */}
                <div className="form-group">
                  <label>Your {currency} Address</label>
                  <div className="address-box">{address}</div>
                </div>

                <button
                  className={`btn btn-full btn-lg ${copied ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleCopy}
                  style={{ marginBottom: '1rem' }}
                >
                  {copied ? '✓ Copied to Clipboard!' : '📋 Copy Address'}
                </button>

                <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
                  <div>
                    <strong>Minimum deposit:</strong> {currInfo.min || '—'}<br />
                    <strong>Network confirmations required:</strong> 1–6 depending on amount<br />
                    Only send <strong>{currency} ({currInfo.name})</strong> to this address.
                  </div>
                </div>

                {/* Deposit Minimums Table */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Minimum Deposits</div>
                  <div className="table-wrapper">
                    <table className="table" style={{ fontSize: '0.82rem' }}>
                      <thead><tr><th>Currency</th><th>Minimum</th><th>Confirmations</th></tr></thead>
                      <tbody>
                        {[
                          ['BTC', '0.0001', '2'],
                          ['ETH', '0.001', '12'],
                          ['LTC', '0.01', '4'],
                          ['XMR', '0.01', '10'],
                          ['USDT', '10', '12'],
                          ['USDC', '10', '12'],
                        ].map(([c, m, conf]) => (
                          <tr key={c}>
                            <td><span className="badge badge-muted">{c}</span></td>
                            <td>{m} {c}</td>
                            <td>{conf}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
