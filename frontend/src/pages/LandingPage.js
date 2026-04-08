import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

const PRICING_TIERS = [
  {
    id: 'free',
    name: 'FREE TIER',
    badge: '🎁 FREE',
    badgeLabel: '7 Day Trial',
    price: '$0',
    period: '',
    hashrate: '10 TH/s',
    earnings: '$1 - $3/day',
    borderColor: '#555',
    buttonText: 'START FREE NOW',
    buttonStyle: { background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff' },
    features: ['Basic Dashboard', 'Daily Payouts', 'Email Support', 'Mobile App'],
    popular: false,
    premium: false,
  },
  {
    id: 'basic',
    name: 'BASIC',
    badge: '🔥 MOST POPULAR',
    badgeLabel: '50% OFF FIRST MONTH',
    price: '$9.99',
    period: '/mo',
    hashrate: '50 TH/s',
    earnings: '$5 - $15/day',
    borderColor: '#3b82f6',
    buttonText: 'UPGRADE TO BASIC',
    buttonStyle: { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff' },
    features: ['Everything in Free', 'Priority Mining', 'Weekly Reports', 'Live Chat Support'],
    popular: true,
    premium: false,
  },
  {
    id: 'advanced',
    name: 'ADVANCED',
    badge: null,
    badgeLabel: null,
    price: '$49.99',
    period: '/mo',
    hashrate: '200 TH/s',
    earnings: '$30 - $75/day',
    borderColor: '#8b5cf6',
    buttonText: 'GET ADVANCED',
    buttonStyle: { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff' },
    features: ['Everything in Basic', 'Advanced Analytics', 'API Access', 'Priority Support', 'Custom Alerts'],
    popular: false,
    premium: false,
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    badge: '👑 BEST VALUE',
    badgeLabel: null,
    price: '$199.99',
    period: '/mo',
    hashrate: '500+ TH/s',
    earnings: '$150+/day',
    borderColor: '#ffd700',
    buttonText: 'GET PREMIUM',
    buttonStyle: { background: 'linear-gradient(135deg, #ffd700, #f59e0b)', color: '#000', fontWeight: '800' },
    features: ['Everything in Advanced', 'Dedicated Manager', 'Custom Mining Config', 'Insurance Coverage', 'VIP Support 24/7'],
    popular: false,
    premium: true,
  },
];

const COMPARISON_ROWS = [
  { feature: 'Mining Power', free: '10 TH/s', basic: '50 TH/s', advanced: '200 TH/s', premium: '500+ TH/s' },
  { feature: 'Daily Earnings', free: '$1–$3', basic: '$5–$15', advanced: '$30–$75', premium: '$150+' },
  { feature: 'Dashboard', free: '✅', basic: '✅', advanced: '✅', premium: '✅' },
  { feature: 'Daily Payouts', free: '✅', basic: '✅', advanced: '✅', premium: '✅' },
  { feature: 'Mobile App', free: '✅', basic: '✅', advanced: '✅', premium: '✅' },
  { feature: 'API Access', free: '❌', basic: '❌', advanced: '✅', premium: '✅' },
  { feature: 'Priority Support', free: '❌', basic: '✅', advanced: '✅', premium: '✅' },
  { feature: 'Account Manager', free: '❌', basic: '❌', advanced: '❌', premium: '✅' },
  { feature: 'Insurance', free: '❌', basic: '❌', advanced: '❌', premium: '✅' },
  { feature: 'Custom Config', free: '❌', basic: '❌', advanced: '❌', premium: '✅' },
];

const FAQS = [
  {
    q: 'How does the free mining trial work?',
    a: 'When you sign up, you instantly get 10 TH/s of real mining power for 7 days at zero cost. No credit card required. Mining starts automatically and earnings are credited to your account daily.',
  },
  {
    q: 'When do I get paid?',
    a: 'Payouts are processed every 24 hours directly to your Bitcoin wallet. There is no minimum withdrawal amount — every satoshi you earn is yours.',
  },
  {
    q: 'Can I upgrade or downgrade anytime?',
    a: 'Absolutely. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades apply at the end of your current billing cycle.',
  },
  {
    q: 'Is my investment secure?',
    a: 'Yes. We use 256-bit SSL encryption, keep 95% of funds in cold storage, and Premium members enjoy insurance coverage. Our platform is SOC 2 compliant and KYC verified.',
  },
  {
    q: 'What cryptocurrencies can I mine?',
    a: 'Our primary focus is Bitcoin (BTC). Ethereum (ETH) mining support is coming soon for Advanced and Premium members. We continuously evaluate new coins for future support.',
  },
  {
    q: 'How does options trading work?',
    a: 'Options give you the right (but not obligation) to buy or sell an asset at a set price before a set date. A Call option profits when the price goes up; a Put option profits when it goes down. You pay a premium upfront and your max loss is limited to that premium.',
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [tickerMsg, setTickerMsg] = useState('💰 +$0.0023 BTC just earned by user_a8x2...');
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [statsAnimated, setStatsAnimated] = useState({ miners: 0, btc: 0 });

  const targetDate = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }, []);

  useEffect(() => {
    const end = targetDate();
    const tick = () => {
      const now = new Date();
      const diff = end - now;
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  useEffect(() => {
    const users = ['user_a8x2', 'btc_k93z', 'miner_f77y', 'crypto_p4x', 'hash_m22q', 'user_t81b'];
    const amounts = ['0.0023', '0.0015', '0.0041', '0.0008', '0.0031', '0.0019'];
    const id = setInterval(() => {
      const u = users[Math.floor(Math.random() * users.length)];
      const a = amounts[Math.floor(Math.random() * amounts.length)];
      setTickerMsg(`💰 +$${a} BTC just earned by ${u}...  |  ⚡ New miner joined!  |  💰 +$${amounts[Math.floor(Math.random() * amounts.length)]} BTC earned by ${users[Math.floor(Math.random() * users.length)]}...`);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let frame;
    let start = null;
    const duration = 2000;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setStatsAnimated({ miners: Math.floor(ease * 50247), btc: parseFloat((ease * 1284.5).toFixed(1)) });
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { frame = requestAnimationFrame(animate); observer.disconnect(); }
    }, { threshold: 0.3 });
    const el = document.getElementById('stats-bar');
    if (el) observer.observe(el);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    navigate(`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };

  const handleFooterEmailSubmit = (e) => {
    e.preventDefault();
    navigate(`/register${footerEmail ? `?email=${encodeURIComponent(footerEmail)}` : ''}`);
  };

  const pad = (n) => String(n).padStart(2, '0');

  const sectionStyle = { padding: '80px 20px' };
  const maxW = { maxWidth: '1200px', margin: '0 auto' };
  const sectionTitle = { fontSize: '2.2rem', fontWeight: '800', textAlign: 'center', marginBottom: '12px' };
  const sectionSub = { color: '#a0a0b0', textAlign: 'center', fontSize: '1.05rem', marginBottom: '48px' };

  return (
    <div style={{ background: '#0a0a0f', color: '#fff', paddingTop: '64px' }}>

      {/* HERO */}
      <section className="hero" id="hero">
        <div style={{ ...maxW, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'rgba(247,147,26,0.15)', border: '1px solid rgba(247,147,26,0.3)', color: '#f7931a', padding: '6px 18px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700', letterSpacing: '1px', marginBottom: '24px' }}>
            🚀 LIMITED TIME OFFER
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: '900', lineHeight: '1.1', marginBottom: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #f7931a 60%, #ffd700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Start Mining Bitcoin FREE
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: '#c0c0d0', maxWidth: '600px', margin: '0 auto 36px', lineHeight: '1.7' }}>
            Get 10 TH/s free for 7 days. No credit card required. Start earning Bitcoin today.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button
              className="pulse"
              onClick={() => navigate('/register')}
              style={{ background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '16px 36px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(247,147,26,0.4)' }}
            >
              START FREE MINING →
            </button>
            <button
              style={{ background: 'transparent', color: '#fff', padding: '16px 32px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: '600', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer' }}
            >
              ▶ WATCH DEMO
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginBottom: '48px' }}>
            {['✅ 50,000+ Active Miners', '💰 $5M+ Earned', '⚡ 99.9% Uptime'].map((item) => (
              <span key={item} style={{ color: '#c0c0d0', fontSize: '0.92rem', fontWeight: '500' }}>{item}</span>
            ))}
          </div>

          {/* Countdown */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ color: '#a0a0b0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Free offer expires in:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {[['Days', countdown.days], ['Hours', countdown.hours], ['Minutes', countdown.minutes], ['Seconds', countdown.seconds]].map(([label, val]) => (
                <div key={label} className="countdown-box">
                  <span className="count-num">{pad(val)}</span>
                  <span className="count-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="ticker-wrap">
        <span className="ticker-content">{tickerMsg}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerMsg}</span>
      </div>

      {/* STATS BAR */}
      <section id="stats-bar" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '48px 20px' }}>
        <div style={{ ...maxW, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
          {[
            { num: statsAnimated.miners.toLocaleString(), label: 'Active Miners' },
            { num: statsAnimated.btc.toLocaleString(), label: 'Total BTC Mined' },
            { num: 'Daily', label: 'Payouts' },
            { num: '99.9%', label: 'Uptime' },
          ].map(({ num, label }) => (
            <div key={label}>
              <span className="stat-number">{num}</span>
              <p style={{ color: '#a0a0b0', marginTop: '8px', fontSize: '0.9rem', fontWeight: '500' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ ...sectionStyle, background: '#0a0a0f' }}>
        <div style={maxW}>
          <h2 style={sectionTitle}>Choose Your Mining Power</h2>
          <p style={sectionSub}>Start free and scale as you grow. Upgrade or downgrade anytime.</p>
          <div className="pricing-grid">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`card-hover ${tier.premium ? 'glow-gold' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `2px solid ${tier.borderColor}`,
                  borderRadius: '20px',
                  padding: '32px 24px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {tier.badge && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span className={tier.premium ? 'badge-premium' : 'badge-popular'}>{tier.badge}</span>
                    {tier.badgeLabel && (
                      <span style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa', fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>{tier.badgeLabel}</span>
                    )}
                  </div>
                )}
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#a0a0b0', letterSpacing: '1px', marginBottom: '12px' }}>{tier.name}</h3>
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '2.8rem', fontWeight: '900', color: tier.premium ? '#ffd700' : '#fff' }}>{tier.price}</span>
                  <span style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>{tier.period}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f7931a' }}>{tier.hashrate}</div>
                  <div style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>Mining Power</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#00d4aa', marginTop: '8px' }}>{tier.earnings}</div>
                  <div style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>Est. Daily Earnings</div>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: '28px', flex: 1 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ padding: '7px 0', color: '#d0d0e0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#00d4aa', fontSize: '0.9rem' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(tier.id === 'free' ? '/register' : '/register')}
                  style={{ ...tier.buttonStyle, padding: '14px', borderRadius: '10px', fontSize: '0.92rem', fontWeight: '700', border: 'none', cursor: 'pointer', width: '100%', transition: 'opacity 0.2s ease' }}
                  onMouseEnter={e => e.target.style.opacity = '0.88'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  {tier.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ ...sectionStyle, background: 'rgba(255,255,255,0.02)' }}>
        <div style={maxW}>
          <h2 style={sectionTitle}>Compare All Plans</h2>
          <p style={sectionSub}>See exactly what you get with each plan.</p>
          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Feature</th>
                  <th>Free</th>
                  <th>Basic</th>
                  <th>Advanced</th>
                  <th style={{ color: '#ffd700' }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>{row.free}</td>
                    <td>{row.basic}</td>
                    <td>{row.advanced}</td>
                    <td style={{ color: row.premium === '✅' ? '#00d4aa' : row.premium.includes('$') ? '#ffd700' : undefined }}>{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FREE MINING OFFER */}
      <section style={{ ...sectionStyle }}>
        <div style={maxW}>
          <div style={{ background: 'linear-gradient(135deg, rgba(247,147,26,0.15) 0%, rgba(255,215,0,0.08) 100%)', border: '2px solid rgba(247,147,26,0.3)', borderRadius: '24px', padding: '60px 40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>🎁 Claim Your FREE Mining Account</h2>
            <p style={{ color: '#c0c0d0', marginBottom: '32px', fontSize: '1.05rem' }}>No credit card required. Start in under 60 seconds.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <ul style={{ listStyle: 'none', textAlign: 'left' }}>
                {['10 TH/s mining power for 7 days', 'Up to $3/day in earnings', 'Full dashboard access', 'No credit card needed', 'Cancel anytime — no questions'].map((item) => (
                  <li key={item} style={{ padding: '8px 0', color: '#d0d0e0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#00d4aa', fontSize: '1.1rem' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '480px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ flex: 1, minWidth: '220px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.95rem' }}
              />
              <button
                type="submit"
                style={{ background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '14px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                GET FREE ACCOUNT →
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ ...sectionStyle, background: 'rgba(255,255,255,0.02)' }}>
        <div style={maxW}>
          <h2 style={sectionTitle}>Why Choose jblk66AI?</h2>
          <p style={sectionSub}>Built for miners who want real results without the complexity.</p>
          <div className="features-grid">
            {[
              { icon: '⛏️', title: 'Real Mining', desc: 'Actual hardware, not simulated. Your TH/s runs on real ASIC miners in our data centers.' },
              { icon: '⚡', title: 'Instant Payouts', desc: 'Withdraw anytime, no minimum. Every satoshi you earn goes straight to your wallet.' },
              { icon: '🛡️', title: '99.9% Uptime', desc: 'Enterprise SLA guaranteed. Redundant power, cooling, and network ensure maximum hashrate.' },
              { icon: '💎', title: 'No Hidden Fees', desc: 'Transparent pricing always. What you see is what you pay — no surprises on your bill.' },
              { icon: '📱', title: 'Mobile App', desc: 'Mine on the go. Track your earnings, manage positions, and trade from iOS & Android.' },
              { icon: '🎧', title: '24/7 Support', desc: 'Always here when you need us. Live chat, email, and phone support for paid members.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px' }}>{title}</h3>
                <p style={{ color: '#a0a0b0', fontSize: '0.92rem', lineHeight: '1.7' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRADING SECTION */}
      <section style={{ ...sectionStyle }}>
        <div style={maxW}>
          <h2 style={sectionTitle}>Trade Bitcoin & Gold Derivatives</h2>
          <p style={sectionSub}>Options and futures trading powered by real-time market data.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {[
              {
                icon: '₿',
                title: 'Bitcoin Trading',
                price: '$43,250',
                change: '+2.3%',
                color: '#f7931a',
                options: ['Call Options', 'Put Options'],
                futures: ['Long BTC', 'Short BTC'],
              },
              {
                icon: '🥇',
                title: 'Gold Trading',
                price: '$1,987',
                change: '+0.8%',
                color: '#ffd700',
                options: ['Call Options', 'Put Options'],
                futures: ['Long GOLD', 'Short GOLD'],
              },
            ].map(({ icon, title, price, change, color, options, futures }) => (
              <div key={title} className="card-hover" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}30`, borderRadius: '20px', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '2rem' }}>{icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{title}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: '800', color }}>{price}</span>
                      <span style={{ color: '#00d4aa', fontSize: '0.85rem', fontWeight: '600' }}>{change}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px' }}>
                    <p style={{ color: '#a0a0b0', fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Options</p>
                    {options.map((o) => <p key={o} style={{ fontSize: '0.85rem', color: '#d0d0e0', padding: '3px 0' }}>• {o}</p>)}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px' }}>
                    <p style={{ color: '#a0a0b0', fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Futures</p>
                    {futures.map((f) => <p key={f} style={{ fontSize: '0.85rem', color: '#d0d0e0', padding: '3px 0' }}>• {f}</p>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/trading')}
              style={{ background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '16px 40px', borderRadius: '10px', fontSize: '1rem', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(247,147,26,0.3)' }}
            >
              START TRADING →
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ ...sectionStyle, background: 'rgba(255,255,255,0.02)' }}>
        <div style={maxW}>
          <h2 style={sectionTitle}>What Our Miners Say</h2>
          <p style={sectionSub}>Join 50,000+ satisfied miners earning Bitcoin every day.</p>
          <div className="testimonials-grid">
            {[
              { name: 'Michael R.', role: 'Advanced Plan Member', text: 'Made $847 in my first month with the Advanced plan. The dashboard is so easy to use and the payouts are always on time!', avatar: 'M' },
              { name: 'Sarah K.', role: 'Premium Plan Member', text: 'Started with the free tier, upgraded to Premium within 2 weeks. Best investment I\'ve made this year. The dedicated manager is incredible.', avatar: 'S' },
              { name: 'David T.', role: 'Premium Plan Member', text: 'The trading platform is next level. Options and futures in one place with crypto mining! Making $200+ per day consistently.', avatar: 'D' },
            ].map(({ name, role, text, avatar }) => (
              <div key={name} className="testimonial-card">
                <div style={{ color: '#ffd700', fontSize: '1.1rem', marginBottom: '16px' }}>⭐⭐⭐⭐⭐</div>
                <p style={{ color: '#d0d0e0', lineHeight: '1.7', marginBottom: '20px', fontSize: '0.95rem' }}>"{text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #f7931a, #ffd700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem' }}>{avatar}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{name}</div>
                    <div style={{ color: '#a0a0b0', fontSize: '0.8rem' }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section style={{ padding: '48px 20px', background: '#0a0a0f' }}>
        <div style={maxW}>
          <p style={{ textAlign: 'center', color: '#a0a0b0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '28px' }}>Trusted & Secured</p>
          <div className="trust-grid">
            {[
              { icon: '🔒', label: 'SSL Secured' },
              { icon: '🛡️', label: '256-bit Encryption' },
              { icon: '✅', label: 'KYC Verified' },
              { icon: '🏛️', label: 'Regulated' },
              { icon: '💼', label: 'SOC 2 Compliant' },
              { icon: '🔐', label: 'Cold Storage' },
            ].map(({ icon, label }) => (
              <div key={label} className="trust-badge">{icon} {label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ ...sectionStyle, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ ...maxW, maxWidth: '760px' }}>
          <h2 style={sectionTitle}>Frequently Asked Questions</h2>
          <p style={sectionSub}>Everything you need to know about jblk66AI.</p>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span style={{ color: '#f7931a', fontSize: '1.2rem', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', display: 'inline-block' }}>+</span>
              </div>
              {openFaq === i && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER EMAIL CAPTURE */}
      <section style={{ background: '#0d0d14', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '80px 20px 40px' }}>
        <div style={{ ...maxW, textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>Ready to Start Mining Bitcoin for FREE?</h2>
          <p style={{ color: '#a0a0b0', marginBottom: '36px', fontSize: '1.05rem' }}>Join 50,000+ miners earning Bitcoin every day. No credit card required.</p>
          <form onSubmit={handleFooterEmailSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '460px', margin: '0 auto 60px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={footerEmail}
              onChange={e => setFooterEmail(e.target.value)}
              required
              style={{ flex: 1, minWidth: '200px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem' }}
            />
            <button
              type="submit"
              style={{ background: 'linear-gradient(135deg, #f7931a, #e8820a)', color: '#fff', padding: '14px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '0.9rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              START FREE MINING
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
            {['🐦 Twitter', '✈️ Telegram', '💬 Discord', '▶️ YouTube'].map((s) => (
              <a key={s} href="#!" style={{ color: '#a0a0b0', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#a0a0b0'}
              >{s}</a>
            ))}
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '28px' }} />
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '16px' }}>© 2024 jblk66AI. All rights reserved.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'Support', 'Blog'].map((link) => (
              <a key={link} href="#!" style={{ color: '#666', fontSize: '0.83rem', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#a0a0b0'}
                onMouseLeave={e => e.target.style.color = '#666'}
              >{link}</a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
