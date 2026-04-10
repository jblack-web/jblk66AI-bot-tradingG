import React from 'react';
import { useNavigate } from 'react-router-dom';

const TIERS = [
  {
    name: 'Free',
    icon: '🆓',
    price: '$0',
    period: '/forever',
    color: '#64748B',
    highlight: false,
    perks: [
      '⛏️ Start cloud mining instantly',
      '📊 Live earnings dashboard',
      '10 daily trades',
      'Basic AI market signals',
      'Community access',
    ],
    cta: 'Start Mining Free',
    ctaStyle: 'secondary',
  },
  {
    name: 'Basic',
    icon: '🔵',
    price: '$29',
    period: '/mo',
    color: '#3B82F6',
    highlight: false,
    perks: [
      '⛏️ Priority mining slots',
      '📈 50 daily trades',
      '🤖 Automated trading bots',
      'Advanced AI insights',
      'Email support',
      '5% referral bonus',
    ],
    cta: 'Upgrade to Basic',
    ctaStyle: 'primary-blue',
  },
  {
    name: 'Advanced',
    icon: '🟣',
    price: '$79',
    period: '/mo',
    color: '#8B5CF6',
    highlight: true,
    badge: '🔥 MOST POPULAR',
    perks: [
      '⛏️ Dedicated mining rigs',
      '📈 200 daily trades',
      '🤖 Full automation suite',
      'Premium AI signals',
      'Priority support',
      '10% referral bonus',
      'Exclusive market reports',
    ],
    cta: 'Upgrade to Advanced',
    ctaStyle: 'primary-purple',
  },
  {
    name: 'Premium',
    icon: '⭐',
    price: '$199',
    period: '/mo',
    color: '#F59E0B',
    highlight: false,
    badge: '💎 VIP',
    perks: [
      '⛏️ Industrial mining rigs',
      '📈 Unlimited trades',
      '🤖 Custom bot strategies',
      '👤 Dedicated account manager',
      '24/7 VIP support',
      '20% referral bonus',
      'Tax & compliance tools',
      'Legal document vault',
    ],
    cta: 'Go Premium',
    ctaStyle: 'primary-gold',
  },
];

const INCENTIVES = [
  { icon: '⛏️', title: 'Mine Bitcoin Free', desc: 'Start earning Bitcoin immediately — no hardware, no setup. Just click and mine.' },
  { icon: '📈', title: 'AI-Powered Trading', desc: 'Let our AI bots trade options, futures, gold and crypto on your behalf 24/7.' },
  { icon: '💰', title: 'Earn & Withdraw', desc: 'Withdraw mining earnings and trading profits directly to your crypto wallet.' },
  { icon: '🤝', title: 'Referral Rewards', desc: 'Earn up to 20% commission on every friend you refer — forever.' },
  { icon: '🔒', title: 'Bank-Grade Security', desc: '2FA, KYC, and AML safeguards protect your funds and data at all times.' },
  { icon: '🌐', title: 'Global Marketplace', desc: 'Buy and sell mining equipment, trading tools, and crypto services.' },
];

const STATS = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '$2M+', label: 'Paid Out' },
  { value: '15,000+', label: 'Active Miners' },
  { value: '5,000+', label: 'Templates' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const s = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a0f1e 100%)',
      color: '#e2e8f0',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(10,15,30,0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    logo: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' },
    logoAccent: { color: '#3B82F6' },
    navButtons: { display: 'flex', gap: 12 },
    btnLogin: {
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.2)',
      color: '#e2e8f0',
      padding: '8px 20px',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
    },
    btnStart: {
      background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
      border: 'none',
      color: '#fff',
      padding: '8px 20px',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
    },

    hero: {
      textAlign: 'center',
      padding: '100px 24px 80px',
      maxWidth: 800,
      margin: '0 auto',
    },
    heroBadge: {
      display: 'inline-block',
      background: 'rgba(59,130,246,0.15)',
      border: '1px solid rgba(59,130,246,0.3)',
      color: '#60A5FA',
      borderRadius: 20,
      padding: '4px 16px',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 24,
    },
    heroTitle: {
      fontSize: 'clamp(36px, 6vw, 64px)',
      fontWeight: 900,
      lineHeight: 1.1,
      marginBottom: 20,
      background: 'linear-gradient(135deg, #fff 40%, #60A5FA)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    heroSub: {
      fontSize: 18,
      color: '#94a3b8',
      lineHeight: 1.6,
      marginBottom: 40,
      maxWidth: 600,
      margin: '0 auto 40px',
    },
    heroCTAs: {
      display: 'flex',
      gap: 16,
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    ctaMining: {
      background: 'linear-gradient(135deg, #10B981, #059669)',
      border: 'none',
      color: '#fff',
      padding: '16px 36px',
      borderRadius: 12,
      cursor: 'pointer',
      fontSize: 18,
      fontWeight: 700,
      boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
      transition: 'transform 0.2s',
    },
    ctaLogin: {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      color: '#e2e8f0',
      padding: '16px 36px',
      borderRadius: 12,
      cursor: 'pointer',
      fontSize: 18,
      fontWeight: 600,
    },

    statsBar: {
      display: 'flex',
      justifyContent: 'center',
      gap: '48px',
      flexWrap: 'wrap',
      padding: '40px 24px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
    },
    statItem: { textAlign: 'center' },
    statValue: { fontSize: 32, fontWeight: 800, color: '#3B82F6' },
    statLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },

    section: { padding: '80px 24px', maxWidth: 1200, margin: '0 auto' },
    sectionTitle: {
      textAlign: 'center',
      fontSize: 36,
      fontWeight: 800,
      color: '#fff',
      marginBottom: 12,
    },
    sectionSub: {
      textAlign: 'center',
      color: '#64748b',
      fontSize: 16,
      marginBottom: 56,
    },

    incentivesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 24,
    },
    incentiveCard: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '28px 24px',
      transition: 'border-color 0.2s',
    },
    incentiveIcon: { fontSize: 36, marginBottom: 16 },
    incentiveTitle: { fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 },
    incentiveDesc: { color: '#94a3b8', fontSize: 14, lineHeight: 1.6 },

    tiersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 24,
    },
    tierCard: (tier) => ({
      background: tier.highlight
        ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))'
        : 'rgba(255,255,255,0.04)',
      border: `1px solid ${tier.highlight ? '#8B5CF6' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 20,
      padding: '32px 24px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: tier.highlight ? '0 0 40px rgba(139,92,246,0.2)' : 'none',
    }),
    tierBadge: (tier) => ({
      display: 'inline-block',
      background: tier.highlight ? '#8B5CF6' : tier.color,
      color: '#fff',
      borderRadius: 12,
      padding: '3px 12px',
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 16,
      alignSelf: 'flex-start',
    }),
    tierIcon: { fontSize: 40, marginBottom: 8 },
    tierName: (tier) => ({ fontSize: 22, fontWeight: 800, color: tier.color, marginBottom: 4 }),
    tierPrice: { fontSize: 42, fontWeight: 900, color: '#fff' },
    tierPeriod: { fontSize: 16, color: '#64748b', fontWeight: 400 },
    tierPerks: { listStyle: 'none', padding: 0, margin: '20px 0 28px', flexGrow: 1 },
    tierPerk: { fontSize: 14, color: '#cbd5e1', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },

    ctaBtn: (style) => {
      const map = {
        secondary: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0' },
        'primary-blue': { background: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: 'none', color: '#fff' },
        'primary-purple': { background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', border: 'none', color: '#fff' },
        'primary-gold': { background: 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'none', color: '#fff' },
      };
      return {
        width: '100%',
        padding: '13px',
        borderRadius: 10,
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: 700,
        marginTop: 'auto',
        ...map[style],
      };
    },

    miningCTA: {
      margin: '0 auto',
      maxWidth: 700,
      background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 24,
      padding: '56px 40px',
      textAlign: 'center',
    },
    miningCtaTitle: { fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 12 },
    miningCtaSub: { color: '#94a3b8', fontSize: 16, marginBottom: 32 },

    footer: {
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '32px 24px',
      textAlign: 'center',
      color: '#475569',
      fontSize: 13,
    },
  };

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}>
          ⚡ JBLK<span style={s.logoAccent}>66</span>AI
        </div>
        <div style={s.navButtons}>
          <button style={s.btnLogin} onClick={() => navigate('/login')}>Log In</button>
          <button style={s.btnStart} onClick={() => navigate('/login')}>⛏️ Start Mining Free</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroBadge}>🚀 All-in-One Crypto SuperApp · Free to Start</div>
        <h1 style={s.heroTitle}>Mine Bitcoin &amp; Trade Smarter — Starting Today, For Free</h1>
        <p style={s.heroSub}>
          Join 15,000+ miners and traders earning daily with cloud mining, AI trading bots, and
          a full crypto marketplace — no hardware required.
        </p>
        <div style={s.heroCTAs}>
          <button style={s.ctaMining} onClick={() => navigate('/login')}>
            ⛏️ Start Mining Free
          </button>
          <button style={s.ctaLogin} onClick={() => navigate('/login')}>
            📈 Explore Platform
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={s.statsBar}>
        {STATS.map(st => (
          <div key={st.label} style={s.statItem}>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Incentives */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Why Join jblk66AI?</h2>
        <p style={s.sectionSub}>Everything you need to earn from crypto — mining, trading, marketplace, and more.</p>
        <div style={s.incentivesGrid}>
          {INCENTIVES.map(inc => (
            <div key={inc.title} style={s.incentiveCard}>
              <div style={s.incentiveIcon}>{inc.icon}</div>
              <div style={s.incentiveTitle}>{inc.title}</div>
              <div style={s.incentiveDesc}>{inc.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Tiers */}
      <div style={{ ...s.section, background: 'rgba(255,255,255,0.01)', borderRadius: 32, marginTop: 0 }}>
        <h2 style={s.sectionTitle}>Choose Your Plan</h2>
        <p style={s.sectionSub}>Start free and upgrade anytime. Every tier unlocks more earning power.</p>
        <div style={s.tiersGrid}>
          {TIERS.map(tier => (
            <div key={tier.name} style={s.tierCard(tier)}>
              {tier.badge && <div style={s.tierBadge(tier)}>{tier.badge}</div>}
              <div style={s.tierIcon}>{tier.icon}</div>
              <div style={s.tierName(tier)}>{tier.name}</div>
              <div>
                <span style={s.tierPrice}>{tier.price}</span>
                <span style={s.tierPeriod}>{tier.period}</span>
              </div>
              <ul style={s.tierPerks}>
                {tier.perks.map(p => (
                  <li key={p} style={s.tierPerk}>✓ {p}</li>
                ))}
              </ul>
              <button
                style={s.ctaBtn(tier.ctaStyle)}
                onClick={() => navigate('/login')}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mining CTA */}
      <div style={s.section}>
        <div style={s.miningCTA}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⛏️</div>
          <div style={s.miningCtaTitle}>Ready to Start Mining Bitcoin?</div>
          <div style={s.miningCtaSub}>
            No hardware. No technical knowledge needed. Create a free account and your first mining rig
            starts earning in seconds.
          </div>
          <button style={{ ...s.ctaMining, fontSize: 18 }} onClick={() => navigate('/login')}>
            ⛏️ Create Free Account &amp; Start Mining
          </button>
        </div>
      </div>

      <footer style={s.footer}>
        <p>© {new Date().getFullYear()} jblk66AI · All Rights Reserved · <span style={{ cursor: 'pointer', color: '#3B82F6' }} onClick={() => navigate('/login')}>Login</span></p>
      </footer>
    </div>
  );
}
