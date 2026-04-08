import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Japan', 'South Korea', 'Singapore', 'New Zealand', 'Brazil', 'Mexico',
  'Argentina', 'Spain', 'Italy', 'Poland', 'Czech Republic', 'Austria',
  'Belgium', 'Finland', 'Ireland', 'Portugal', 'Greece', 'India', 'Other',
];

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: searchParams.get('email') || '',
    password: '',
    confirmPassword: '',
    country: '',
    referral: searchParams.get('ref') || '',
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const refParam = searchParams.get('ref');
    if (emailParam) setForm(prev => ({ ...prev, email: emailParam }));
    if (refParam) setForm(prev => ({ ...prev, referral: refParam }));
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.country) errs.country = 'Please select your country.';
    if (!form.terms) errs.terms = 'You must accept the Terms of Service.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      const res = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        country: form.country,
        referralCode: form.referral || undefined,
      });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
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
    maxWidth: '520px',
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '0.95rem',
    display: 'block',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle = {
    color: '#a0a0b0',
    fontSize: '0.88rem',
    fontWeight: '500',
    display: 'block',
    marginBottom: '6px',
  };

  const errStyle = {
    color: '#ff4757',
    fontSize: '0.8rem',
    marginTop: '4px',
    display: 'block',
  };

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px', color: '#00d4aa' }}>Account Created!</h2>
          <p style={{ color: '#c0c0d0', marginBottom: '8px' }}>Your FREE mining account is now active.</p>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>10 TH/s mining power has been activated for 7 days.</p>
          <div style={{ marginTop: '20px', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '10px', padding: '16px', color: '#00d4aa', fontSize: '0.9rem' }}>
            ✅ Redirecting to your dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⛏️</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>Create Your Free Account</h1>
          <p style={{ color: '#a0a0b0', fontSize: '0.9rem' }}>Start earning Bitcoin in under 60 seconds</p>
        </div>

        <div style={{ background: 'rgba(247,147,26,0.1)', border: '1px solid rgba(247,147,26,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '28px', textAlign: 'center' }}>
          <span style={{ color: '#f7931a', fontWeight: '700', fontSize: '0.9rem' }}>🎁 FREE: 10 TH/s mining power for 7 days</span>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="John"
                style={{ ...inputStyle, borderColor: fieldErrors.firstName ? '#ff4757' : 'rgba(255,255,255,0.15)' }}
                onFocus={e => e.target.style.borderColor = '#f7931a'}
                onBlur={e => e.target.style.borderColor = fieldErrors.firstName ? '#ff4757' : 'rgba(255,255,255,0.15)'}
              />
              {fieldErrors.firstName && <span style={errStyle}>{fieldErrors.firstName}</span>}
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Doe"
                style={{ ...inputStyle, borderColor: fieldErrors.lastName ? '#ff4757' : 'rgba(255,255,255,0.15)' }}
                onFocus={e => e.target.style.borderColor = '#f7931a'}
                onBlur={e => e.target.style.borderColor = fieldErrors.lastName ? '#ff4757' : 'rgba(255,255,255,0.15)'}
              />
              {fieldErrors.lastName && <span style={errStyle}>{fieldErrors.lastName}</span>}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={{ ...inputStyle, borderColor: fieldErrors.email ? '#ff4757' : 'rgba(255,255,255,0.15)' }}
              onFocus={e => e.target.style.borderColor = '#f7931a'}
              onBlur={e => e.target.style.borderColor = fieldErrors.email ? '#ff4757' : 'rgba(255,255,255,0.15)'}
            />
            {fieldErrors.email && <span style={errStyle}>{fieldErrors.email}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              style={{ ...inputStyle, borderColor: fieldErrors.password ? '#ff4757' : 'rgba(255,255,255,0.15)' }}
              onFocus={e => e.target.style.borderColor = '#f7931a'}
              onBlur={e => e.target.style.borderColor = fieldErrors.password ? '#ff4757' : 'rgba(255,255,255,0.15)'}
            />
            {fieldErrors.password && <span style={errStyle}>{fieldErrors.password}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              style={{ ...inputStyle, borderColor: fieldErrors.confirmPassword ? '#ff4757' : 'rgba(255,255,255,0.15)' }}
              onFocus={e => e.target.style.borderColor = '#f7931a'}
              onBlur={e => e.target.style.borderColor = fieldErrors.confirmPassword ? '#ff4757' : 'rgba(255,255,255,0.15)'}
            />
            {fieldErrors.confirmPassword && <span style={errStyle}>{fieldErrors.confirmPassword}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Country</label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              style={{ ...inputStyle, borderColor: fieldErrors.country ? '#ff4757' : 'rgba(255,255,255,0.15)', appearance: 'none', cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#f7931a'}
              onBlur={e => e.target.style.borderColor = fieldErrors.country ? '#ff4757' : 'rgba(255,255,255,0.15)'}
            >
              <option value="" style={{ background: '#1a1a2e' }}>Select your country</option>
              {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>)}
            </select>
            {fieldErrors.country && <span style={errStyle}>{fieldErrors.country}</span>}
          </div>

          {(form.referral || searchParams.get('ref')) && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Referral Code</label>
              <input
                type="text"
                name="referral"
                value={form.referral}
                onChange={handleChange}
                placeholder="Referral code"
                style={{ ...inputStyle, borderColor: 'rgba(0,212,170,0.3)' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                style={{ accentColor: '#f7931a', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ color: '#a0a0b0', fontSize: '0.88rem', lineHeight: '1.5' }}>
                I agree to the{' '}
                <a href="#!" style={{ color: '#f7931a', textDecoration: 'none' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="#!" style={{ color: '#f7931a', textDecoration: 'none' }}>Privacy Policy</a>
              </span>
            </label>
            {fieldErrors.terms && <span style={{ ...errStyle, marginTop: '6px' }}>{fieldErrors.terms}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(247,147,26,0.5)' : 'linear-gradient(135deg, #f7931a, #e8820a)',
              color: '#fff',
              padding: '15px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '1rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {loading ? '⏳ Creating Account...' : 'START FREE MINING →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#a0a0b0', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#f7931a', fontWeight: '600', textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
