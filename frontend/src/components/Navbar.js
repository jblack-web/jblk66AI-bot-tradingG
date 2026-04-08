import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setDropdownOpen(false);
    navigate('/');
  };

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: scrolled ? 'rgba(10,10,15,0.98)' : '#0a0a0f',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    transition: 'background 0.3s ease',
  };

  const innerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const logoStyle = {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: '#f7931a',
    letterSpacing: '-0.5px',
    textDecoration: 'none',
  };

  const linkStyle = {
    color: '#c0c0d0',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'color 0.2s ease',
    padding: '6px 0',
  };

  const btnStartStyle = {
    background: 'linear-gradient(135deg, #f7931a, #e8820a)',
    color: '#fff',
    padding: '9px 22px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.88rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    whiteSpace: 'nowrap',
  };

  const desktopLinksStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  };

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <Link to="/" style={logoStyle}>⛏️ jblk66AI</Link>

        {/* Desktop links */}
        <div style={{ ...desktopLinksStyle, '@media(maxWidth:768px)': { display: 'none' } }} className="nav-desktop">
          <Link to="/" style={linkStyle}>Home</Link>
          <Link to="/#features" style={linkStyle}>Features</Link>
          <Link to="/#pricing" style={linkStyle}>Pricing</Link>
          <Link to="/trading" style={linkStyle}>Trading</Link>

          {token ? (
            <>
              <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  👤 {user?.firstName || user?.email?.split('@')[0] || 'Account'}
                  <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>▼</span>
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    padding: '8px',
                    minWidth: '180px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    zIndex: 100,
                  }}>
                    <Link to="/dashboard" style={{ display: 'block', padding: '10px 14px', color: '#e0e0e0', fontSize: '0.88rem', borderRadius: '6px', textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >📊 Dashboard</Link>
                    <Link to="/trading" style={{ display: 'block', padding: '10px 14px', color: '#e0e0e0', fontSize: '0.88rem', borderRadius: '6px', textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >📈 Trading</Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" style={{ display: 'block', padding: '10px 14px', color: '#f7931a', fontSize: '0.88rem', borderRadius: '6px', textDecoration: 'none' }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                      >⚙️ Admin Panel</Link>
                    )}
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '6px 0' }} />
                    <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', color: '#ff4757', fontSize: '0.88rem', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,71,87,0.1)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >🚪 Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={linkStyle}>Login</Link>
              <Link to="/register" style={btnStartStyle}>START FREE</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '1.4rem',
            cursor: 'pointer',
          }}
          className="nav-hamburger"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: '#0d0d14',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 20px 24px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Link to="/" style={{ ...linkStyle, padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Home</Link>
            <Link to="/#features" style={{ ...linkStyle, padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Features</Link>
            <Link to="/#pricing" style={{ ...linkStyle, padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Pricing</Link>
            <Link to="/trading" style={{ ...linkStyle, padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Trading</Link>
            {token ? (
              <>
                <Link to="/dashboard" style={{ ...linkStyle, padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Dashboard</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" style={{ ...linkStyle, padding: '12px 8px', color: '#f7931a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Admin Panel</Link>
                )}
                <button onClick={handleLogout} style={{ ...linkStyle, padding: '12px 8px', color: '#ff4757', background: 'none', border: 'none', textAlign: 'left', fontSize: '0.9rem', fontWeight: '500' }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ ...linkStyle, padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Login</Link>
                <Link to="/register" style={{ ...btnStartStyle, marginTop: '12px', textAlign: 'center', padding: '12px 22px' }}>START FREE MINING</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
