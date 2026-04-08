import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (d) => api.post('/api/auth/login', d),
  register: (d) => api.post('/api/auth/register', d),
  profile: () => api.get('/api/auth/profile'),
  updateProfile: (d) => api.put('/api/auth/profile', d),
  changePassword: (d) => api.put('/api/auth/change-password', d),
};

export const wallet = {
  getBalance: () => api.get('/api/wallet/balance'),
  deposit: (d) => api.post('/api/wallet/deposit', d),
  withdraw: (d) => api.post('/api/wallet/withdraw', d),
  transactions: (p) => api.get('/api/wallet/transactions', { params: p }),
  applyPromo: (d) => api.post('/api/wallet/promo', d),
};

export const trades = {
  list: (p) => api.get('/api/trades', { params: p }),
  stats: () => api.get('/api/trades/stats'),
};

export const options = {
  getActive: () => api.get('/api/options/positions'),
  placeOrder: (d) => api.post('/api/options/place', d),
  close: (id) => api.post(`/api/options/close/${id}`),
  history: (p) => api.get('/api/options/history', { params: p }),
};

export const futures = {
  getActive: () => api.get('/api/futures/positions'),
  openPosition: (d) => api.post('/api/futures/open', d),
  close: (id) => api.post(`/api/futures/close/${id}`),
  history: (p) => api.get('/api/futures/history', { params: p }),
};

export const gold = {
  getPrice: () => api.get('/api/gold/price'),
  buy: (d) => api.post('/api/gold/buy', d),
  sell: (d) => api.post('/api/gold/sell', d),
  positions: () => api.get('/api/gold/positions'),
};

export const payments = {
  initiate: (d) => api.post('/api/payments/initiate', d),
  verify: (d) => api.post('/api/payments/verify', d),
};

export const tiers = {
  list: () => api.get('/api/tiers'),
  subscribe: (d) => api.post('/api/tiers/subscribe', d),
};

export const notifications = {
  list: (p) => api.get('/api/notifications', { params: p }),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
  delete: (id) => api.delete(`/api/notifications/${id}`),
  preferences: () => api.get('/api/notifications/preferences'),
  updatePreferences: (d) => api.put('/api/notifications/preferences', d),
};

export const admin = {
  stats: () => api.get('/api/admin/stats'),
  users: (p) => api.get('/api/admin/users', { params: p }),
  updateUser: (id, d) => api.put(`/api/admin/users/${id}`, d),
  withdrawals: (p) => api.get('/api/admin/withdrawals', { params: p }),
  approveWithdrawal: (id) => api.post(`/api/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id) => api.post(`/api/admin/withdrawals/${id}/reject`),
  settings: () => api.get('/api/admin/settings'),
  updateSettings: (d) => api.put('/api/admin/settings', d),
};

export const aiInsights = {
  list: (p) => api.get('/api/ai-insights', { params: p }),
  daily: () => api.get('/api/ai-insights/daily'),
  stats: () => api.get('/api/ai-insights/stats'),
};

export const accountManager = {
  status: () => api.get('/api/account-manager/status'),
  subscribe: (d) => api.post('/api/account-manager/subscribe', d),
  meetings: () => api.get('/api/account-manager/meetings'),
  performance: () => api.get('/api/account-manager/performance'),
};

export default api;
