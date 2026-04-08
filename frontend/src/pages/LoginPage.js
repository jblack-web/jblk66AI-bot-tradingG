import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const S = {
  page: { minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 40, width: '100%', maxWidth: 420 },
  logo: { textAlign: 'center', marginBottom: 32 },
  h1: { color: '#00d4ff', fontSize: 28, fontWeight: 700, margin: 0 },
  sub: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  label: { color: '#9ca3af', fontSize: 13, display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px', background: '#00d4ff', color: '#0a0e1a', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  link: { color: '#00d4ff', textDecoration: 'none' },
  footer: { textAlign: 'center', color: '#6b7280', fontSize: 13, marginTop: 24 },
  field: { marginBottom: 18 },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <h1 style={S.h1}>⚡ jblk66AI</h1>
          <p style={S.sub}>Advanced AI Trading Platform</p>
        </div>
        {error && <div style={S.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Email Address</label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button style={S.btn} type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div style={S.footer}>
          Don't have an account? <Link to="/register" style={S.link}>Register</Link>
        </div>
      </div>
    </div>
  );
}
