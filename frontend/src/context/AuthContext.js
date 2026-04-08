import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jblk_token'));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (tok) => {
    if (!tok) { setLoading(false); return; }
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || data);
      } else {
        localStorage.removeItem('jblk_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      // Network error — keep token but no user
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(token); }, [token, fetchMe]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('jblk_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('jblk_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isAdmin, isSeller, loading, refreshUser: () => fetchMe(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
