import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marketplace } from '../services/api';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isSeller, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      marketplace.getCart()
        .then(data => setCartCount((data.items || []).length))
        .catch(() => {});
    } else {
      setCartCount(0);
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          ⚡ <span style={{ color: 'var(--primary)' }}>jblk66AI</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          <Link to="/" style={{ ...styles.link, ...(location.pathname === '/' ? styles.linkActive : {}) }}>Home</Link>
          <Link to="/marketplace" style={{ ...styles.link, ...(isActive('/marketplace') ? styles.linkActive : {}) }}>Marketplace</Link>
          <Link to="/mining" style={{ ...styles.link, ...(isActive('/mining') ? styles.linkActive : {}) }}>Mining</Link>
          {isAuthenticated && (
            <Link to="/wallet" style={{ ...styles.link, ...(isActive('/wallet') ? styles.linkActive : {}) }}>Wallet</Link>
          )}
          {isAdmin && (
            <Link to="/admin" style={{ ...styles.link, color: 'var(--primary)', ...(isActive('/admin') ? styles.linkActive : {}) }}>
              🛡 Admin
            </Link>
          )}
          {isSeller && !isAdmin && (
            <Link to="/seller" style={{ ...styles.link, ...(isActive('/seller') ? styles.linkActive : {}) }}>
              🏪 Seller
            </Link>
          )}
        </div>

        {/* Right actions */}
        <div style={styles.actions}>
          {isAuthenticated && (
            <Link to="/cart" style={styles.cartBtn} title="Cart">
              🛒
              {cartCount > 0 && (
                <span style={styles.cartBadge}>{cartCount}</span>
              )}
            </Link>
          )}

          {isAuthenticated ? (
            <div style={styles.userMenu}>
              <span style={styles.username}>👤 {user?.name || user?.email?.split('@')[0] || 'User'}</span>
              <div style={styles.dropdown}>
                <Link to="/dashboard" style={styles.dropItem}>📊 Dashboard</Link>
                <Link to="/orders" style={styles.dropItem}>📦 Orders</Link>
                <Link to="/referrals" style={styles.dropItem}>🔗 Referrals</Link>
                <div style={styles.dropDivider} />
                <button onClick={handleLogout} style={styles.dropItem}>🚪 Logout</button>
              </div>
            </div>
          ) : (
            <div style={styles.authBtns}>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}

          <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/marketplace" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Marketplace</Link>
          <Link to="/mining" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Mining</Link>
          {isAuthenticated && <>
            <Link to="/wallet" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Wallet</Link>
            <Link to="/dashboard" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/orders" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Orders</Link>
            <Link to="/cart" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Cart {cartCount > 0 ? `(${cartCount})` : ''}</Link>
            <Link to="/referrals" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Referrals</Link>
            {isAdmin && <Link to="/admin" style={{ ...styles.mobileLink, color: 'var(--primary)' }} onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
            {isSeller && !isAdmin && <Link to="/seller" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Seller Dashboard</Link>}
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{ ...styles.mobileLink, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--danger)' }}>Logout</button>
          </>}
          {!isAuthenticated && <>
            <Link to="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Register</Link>
          </>}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    background: '#0d1117',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 1.25rem',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  logo: {
    fontSize: '1.3rem',
    fontWeight: 900,
    color: 'var(--text)',
    textDecoration: 'none',
    letterSpacing: '-0.02em',
    flexShrink: 0,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    justifyContent: 'center',
  },
  link: {
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: 600,
    transition: 'color 0.15s, background 0.15s',
  },
  linkActive: {
    color: 'var(--primary)',
    background: 'rgba(245,158,11,0.1)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  cartBtn: {
    position: 'relative',
    fontSize: '1.3rem',
    textDecoration: 'none',
    lineHeight: 1,
    padding: '0.25rem',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: 'var(--danger)',
    color: '#fff',
    borderRadius: '50%',
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: 800,
  },
  userMenu: {
    position: 'relative',
    cursor: 'pointer',
  },
  username: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text)',
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    display: 'block',
    userSelect: 'none',
  },
  dropdown: {
    position: 'absolute',
    top: '110%',
    right: 0,
    background: '#0d1117',
    border: '1px solid var(--border)',
    borderRadius: 8,
    minWidth: 180,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    display: 'none',
    flexDirection: 'column',
    zIndex: 999,
  },
  dropItem: {
    display: 'block',
    padding: '0.7rem 1rem',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.88rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  dropDivider: {
    height: 1,
    background: 'var(--border)',
    margin: '0.25rem 0',
  },
  authBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    fontSize: '1.3rem',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  mobileMenu: {
    background: '#0d1117',
    borderTop: '1px solid var(--border)',
    padding: '0.5rem 0',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileLink: {
    display: 'block',
    padding: '0.75rem 1.25rem',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
};
