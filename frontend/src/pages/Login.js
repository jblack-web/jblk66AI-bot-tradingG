import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ email: form.email, password: form.password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px 40px',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '0.95rem',
    marginTop: '6px',
    display: 'block',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle = {
    color: '#a0a0b0',
    fontSize: '0.88rem',
    fontWeight: '500',
    display: 'block',
    marginBottom: '2px',
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>⛏️</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Sign in to your jblk66AI account</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#f7931a'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#f7931a'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#a0a0b0', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                style={{ accentColor: '#f7931a', width: '15px', height: '15px' }}
              />
              Remember me
            </label>
            <a href="#!" style={{ color: '#f7931a', fontSize: '0.88rem', textDecoration: 'none' }}>Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(247,147,26,0.5)' : 'linear-gradient(135deg, #f7931a, #e8820a)',
              color: '#fff',
              padding: '14px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '1rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s ease',
              letterSpacing: '0.5px',
            }}
          >
            {loading ? '⏳ Signing in...' : 'LOGIN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', color: '#a0a0b0', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#f7931a', fontWeight: '600', textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
