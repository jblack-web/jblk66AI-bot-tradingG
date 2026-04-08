import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ASSETS = {
  BTC: { symbol: '₿', name: 'Bitcoin', price: 43250, change: 2.3, color: '#f7931a' },
  ETH: { symbol: 'Ξ', name: 'Ethereum', price: 2340, change: 1.1, color: '#627eea' },
  GOLD: { symbol: '🥇', name: 'Gold', price: 1987, change: 0.8, color: '#ffd700' },
  SILVER: { symbol: '🥈', name: 'Silver', price: 23.45, change: -0.3, color: '#c0c0c0' },
};

function generatePriceData(base, count = 24) {
  const data = [];
  let price = base * 0.97;
  for (let i = 0; i < count; i++) {
    price = price * (1 + (Math.random() - 0.48) * 0.008);
    data.push({ hour: `${i}:00`, price: parseFloat(price.toFixed(2)) });
  }
  data.push({ hour: 'Now', price: base });
  return data;
}

const MOCK_POSITIONS = [
  { id: 1, asset: 'BTC', type: 'Long', size: '$500', entry: '$42,800', current: '$43,250', pnl: '+$5.26', pnlColor: '#00d4aa' },
  { id: 2, asset: 'BTC', type: 'Call Option', size: '$100', entry: '$43,000', current: '$43,250', pnl: '+$12.50', pnlColor: '#00d4aa' },
];

const MOCK_HISTORY = [
  { date: '2024-01-15', asset: 'BTC', type: 'Long', size: '$300', entry: '$41,200', exit: '$43,100', pnl: '+$13.84', status: 'profit' },
  { date: '2024-01-14', asset: 'ETH', type: 'Call', size: '$200', entry: '$2,180', exit: '$2,250', pnl: '+$6.42', status: 'profit' },
  { date: '2024-01-13', asset: 'GOLD', type: 'Put', size: '$150', entry: '$1,998', exit: '$1,978', pnl: '+$3.00', status: 'profit' },
  { date: '2024-01-12', asset: 'BTC', type: 'Short', size: '$400', entry: '$43,500', exit: '$43,800', pnl: '-$2.76', status: 'loss' },
  { date: '2024-01-11', asset: 'ETH', type: 'Long', size: '$250', entry: '$2,310', exit: '$2,290', pnl: '-$2.17', status: 'loss' },
];

function TradingDashboard() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [priceData, setPriceData] = useState([]);

  const [optionType, setOptionType] = useState('call');
  const [strikePrice, setStrikePrice] = useState('');
  const [expiry, setExpiry] = useState('7');
  const [optionAmount, setOptionAmount] = useState('');

  const [futuresDir, setFuturesDir] = useState('long');
  const [leverage, setLeverage] = useState(1);
  const [futuresAmount, setFuturesAmount] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const [tradeMsg, setTradeMsg] = useState('');

  const asset = ASSETS[selectedAsset];

  useEffect(() => {
    setPriceData(generatePriceData(asset.price));
    setStrikePrice(String(asset.price));
  }, [selectedAsset, asset.price]);

  const marginRequired = futuresAmount ? ((parseFloat(futuresAmount) || 0) / leverage).toFixed(2) : '0.00';
  const liqPrice = futuresAmount && parseFloat(futuresAmount) > 0
    ? futuresDir === 'long'
      ? (asset.price * (1 - 1 / leverage) * 0.99).toFixed(2)
      : (asset.price * (1 + 1 / leverage) * 1.01).toFixed(2)
    : '—';

  const optionPremium = optionAmount ? ((parseFloat(optionAmount) || 0) * 0.04).toFixed(2) : '0.00';

  const handleBuyOption = () => {
    if (!optionAmount || parseFloat(optionAmount) <= 0) { setTradeMsg('❌ Enter a valid amount.'); return; }
    setTradeMsg(`✅ ${optionType.toUpperCase()} option placed for $${optionAmount} (${selectedAsset}, exp ${expiry}d)`);
    setTimeout(() => setTradeMsg(''), 4000);
    setOptionAmount('');
  };

  const handleOpenPosition = () => {
    if (!futuresAmount || parseFloat(futuresAmount) <= 0) { setTradeMsg('❌ Enter a valid amount.'); return; }
    setTradeMsg(`✅ ${futuresDir.toUpperCase()} ${selectedAsset} opened — $${futuresAmount} @ ${leverage}x`);
    setTimeout(() => setTradeMsg(''), 4000);
    setFuturesAmount('');
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '0.92rem',
    boxSizing: 'border-box',
    marginTop: '6px',
  };

  const labelStyle = {
    color: '#a0a0b0',
    fontSize: '0.82rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '80px 20px 60px', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '24px' }}>📈 Trading Platform</h1>

        {tradeMsg && (
          <div style={{ background: tradeMsg.startsWith('✅') ? 'rgba(0,212,170,0.12)' : 'rgba(255,71,87,0.12)', border: `1px solid ${tradeMsg.startsWith('✅') ? 'rgba(0,212,170,0.3)' : 'rgba(255,71,87,0.3)'}`, color: tradeMsg.startsWith('✅') ? '#00d4aa' : '#ff4757', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: '600' }}>
            {tradeMsg}
          </div>
        )}

        {/* Asset Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {Object.entries(ASSETS).map(([key, a]) => (
            <button
              key={key}
              onClick={() => setSelectedAsset(key)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${selectedAsset === key ? a.color : 'rgba(255,255,255,0.12)'}`,
                background: selectedAsset === key ? `${a.color}18` : 'rgba(255,255,255,0.04)',
                color: selectedAsset === key ? a.color : '#a0a0b0',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {a.symbol} {key}
            </button>
          ))}
        </div>

        {/* Price Display */}
        <div style={{ ...cardStyle, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: '#a0a0b0', fontSize: '0.85rem', marginBottom: '4px' }}>{asset.name} / USD</p>
            <span style={{ fontSize: '2.5rem', fontWeight: '900', color: asset.color }}>
              ${asset.price.toLocaleString()}
            </span>
            <span style={{ marginLeft: '12px', color: asset.change >= 0 ? '#00d4aa' : '#ff4757', fontWeight: '700', fontSize: '1.1rem' }}>
              {asset.change >= 0 ? '+' : ''}{asset.change}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['24h High', `$${(asset.price * 1.025).toLocaleString(undefined, { maximumFractionDigits: 2 })}`], ['24h Low', `$${(asset.price * 0.975).toLocaleString(undefined, { maximumFractionDigits: 2 })}`], ['Volume', '$4.2B']].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '3px' }}>{l}</p>
                <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#a0a0b0', marginBottom: '16px' }}>24H PRICE CHART</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="#555" tick={{ fill: '#666', fontSize: 11 }} interval={3} />
                <YAxis stroke="#555" tick={{ fill: '#666', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`$${v.toLocaleString()}`, selectedAsset]} />
                <Line type="monotone" dataKey="price" stroke={asset.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trading Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>

          {/* Options Panel */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>📊 Options Trading</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['call', 'put'].map((t) => (
                <button
                  key={t}
                  onClick={() => setOptionType(t)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: optionType === t ? (t === 'call' ? '#00d4aa' : '#ff4757') : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {t === 'call' ? '📈 CALL' : '📉 PUT'}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Strike Price (USD)</label>
              <input type="number" value={strikePrice} onChange={e => setStrikePrice(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Expiry</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {['7', '30', '90'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setExpiry(d)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: '8px', border: `1px solid ${expiry === d ? '#f7931a' : 'rgba(255,255,255,0.15)'}`, background: expiry === d ? 'rgba(247,147,26,0.15)' : 'rgba(255,255,255,0.04)', color: expiry === d ? '#f7931a' : '#a0a0b0', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Amount (USD)</label>
              <input type="number" value={optionAmount} onChange={e => setOptionAmount(e.target.value)} placeholder="100" style={inputStyle} />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#a0a0b0' }}>Premium</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>${optionPremium}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0b0' }}>Contract Size</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>1.0</span>
              </div>
            </div>
            <button
              onClick={handleBuyOption}
              style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: optionType === 'call' ? 'linear-gradient(135deg, #00d4aa, #00b894)' : 'linear-gradient(135deg, #ff4757, #d63031)', color: '#fff', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer' }}
            >
              {optionType === 'call' ? '📈 BUY CALL' : '📉 BUY PUT'}
            </button>
          </div>

          {/* Futures Panel */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>📈 Futures Trading</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['long', 'short'].map((d) => (
                <button
                  key={d}
                  onClick={() => setFuturesDir(d)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: futuresDir === d ? (d === 'long' ? '#00d4aa' : '#ff4757') : 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', transition: 'background 0.2s ease' }}
                >
                  {d === 'long' ? '🟢 LONG' : '🔴 SHORT'}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Leverage</label>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {[1, 2, 5, 10, 25, 50, 100].map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setLeverage(lv)}
                    style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${leverage === lv ? '#f7931a' : 'rgba(255,255,255,0.12)'}`, background: leverage === lv ? 'rgba(247,147,26,0.15)' : 'rgba(255,255,255,0.04)', color: leverage === lv ? '#f7931a' : '#a0a0b0', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {lv}x
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Amount (USD)</label>
              <input type="number" value={futuresAmount} onChange={e => setFuturesAmount(e.target.value)} placeholder="500" style={inputStyle} />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#a0a0b0' }}>Margin Required</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>${marginRequired}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0b0' }}>Liq. Price</span>
                <span style={{ color: '#ff4757', fontWeight: '600' }}>{liqPrice !== '—' ? `$${parseFloat(liqPrice).toLocaleString()}` : '—'}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Stop Loss</label>
                <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="Optional" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Take Profit</label>
                <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="Optional" style={inputStyle} />
              </div>
            </div>
            <button
              onClick={handleOpenPosition}
              style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: futuresDir === 'long' ? 'linear-gradient(135deg, #00d4aa, #00b894)' : 'linear-gradient(135deg, #ff4757, #d63031)', color: '#fff', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer' }}
            >
              {futuresDir === 'long' ? '🟢 OPEN LONG' : '🔴 OPEN SHORT'}
            </button>
          </div>
        </div>

        {/* Open Positions */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>📂 Open Positions</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  {['Asset', 'Type', 'Size', 'Entry', 'Current', 'P&L', 'Actions'].map(h => (
                    <th key={h} style={{ color: '#a0a0b0', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_POSITIONS.map((pos) => (
                  <tr key={pos.id}>
                    <td style={{ padding: '12px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{pos.asset}</td>
                    <td style={{ padding: '12px', color: pos.type.includes('Long') || pos.type.includes('Call') ? '#00d4aa' : '#ff4757', fontSize: '0.88rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{pos.type}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{pos.size}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{pos.entry}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{pos.current}</td>
                    <td style={{ padding: '12px', color: pos.pnlColor, fontWeight: '700', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{pos.pnl}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <button style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Close</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade History */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>📋 Trade History</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  {['Date', 'Asset', 'Type', 'Size', 'Entry', 'Exit', 'P&L', 'Status'].map(h => (
                    <th key={h} style={{ color: '#a0a0b0', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORY.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '12px', color: '#888', fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.date}</td>
                    <td style={{ padding: '12px', fontWeight: '700', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.asset}</td>
                    <td style={{ padding: '12px', color: '#a0a0b0', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.type}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.size}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0', fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.entry}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0', fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.exit}</td>
                    <td style={{ padding: '12px', color: row.status === 'profit' ? '#00d4aa' : '#ff4757', fontWeight: '700', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.pnl}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ background: row.status === 'profit' ? 'rgba(0,212,170,0.15)' : 'rgba(255,71,87,0.15)', color: row.status === 'profit' ? '#00d4aa' : '#ff4757', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Warning */}
        <div style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: '12px', padding: '16px 20px', fontSize: '0.85rem', color: '#a0a0b0', lineHeight: '1.6' }}>
          ⚠️ <strong style={{ color: '#ff4757' }}>Risk Warning:</strong> Trading derivatives involves substantial risk of loss and is not appropriate for all investors. Leverage can work against you as well as for you. You may lose more than your initial investment. Past performance is not indicative of future results.
        </div>

      </div>
    </div>
  );
}

export default TradingDashboard;
