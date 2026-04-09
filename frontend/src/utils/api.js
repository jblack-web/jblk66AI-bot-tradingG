import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Templates
export const templateAPI = {
  getAll: (params) => api.get('/templates', { params }),
  getOne: (id) => api.get(`/templates/${id}`),
  getCategories: () => api.get('/templates/categories'),
  getFeatured: () => api.get('/templates/featured'),
  getTrending: () => api.get('/templates/trending'),
  download: (id) => api.post(`/templates/${id}/download`),
  addReview: (id, data) => api.post(`/templates/${id}/review`, data),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  getStats: () => api.get('/templates/admin/stats'),
};

// Payments
export const paymentAPI = {
  send: (data) => api.post('/payments/send', data),
  receive: (data) => api.post('/payments/receive', data),
  getHistory: (params) => api.get('/payments/history', { params }),
  requestWithdrawal: (data) => api.post('/payments/withdrawal', data),
  getWalletAddress: (currency) => api.get('/payments/wallet-address', { params: { currency } }),
  adminGetAll: (params) => api.get('/payments/admin/all', { params }),
  adminConfirmDeposit: (id) => api.patch(`/payments/admin/deposit/${id}/confirm`),
  adminProcessWithdrawal: (id, data) => api.patch(`/payments/admin/withdrawal/${id}/process`, data),
};

// Withdrawals
export const withdrawalAPI = {
  getSettings: () => api.get('/withdrawals/settings'),
  getFullSettings: () => api.get('/withdrawals/settings/full'),
  updateSettings: (data) => api.put('/withdrawals/settings', data),
  toggleMode: () => api.patch('/withdrawals/settings/toggle-mode'),
  getPending: (params) => api.get('/withdrawals/pending', { params }),
  getMyRequests: (params) => api.get('/withdrawals/my-requests', { params }),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  creditUser: (id, data) => api.post(`/admin/users/${id}/credit`, data),
  getManagers: () => api.get('/admin/managers'),
  getPromoCodes: () => api.get('/admin/promo-codes'),
  createPromoCode: (data) => api.post('/admin/promo-codes', data),
  updatePromoCode: (id, data) => api.put(`/admin/promo-codes/${id}`, data),
  deletePromoCode: (id) => api.delete(`/admin/promo-codes/${id}`),
  getTiers: () => api.get('/admin/tiers'),
  createTier: (data) => api.post('/admin/tiers', data),
  updateTier: (id, data) => api.put(`/admin/tiers/${id}`, data),
};

// Tiers
export const tierAPI = {
  getAll: () => api.get('/tiers'),
  subscribe: (data) => api.post('/tiers/subscribe', data),
  getMySubscription: () => api.get('/tiers/my-subscription'),
};

// Users
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getWallet: () => api.get('/users/wallet'),
};

// AI Insights
export const aiInsightsAPI = {
  getAll: (params) => api.get('/ai-insights/all', { params }),
  getActive: (params) => api.get('/ai-insights/insights', { params }),
  getConfig: () => api.get('/ai-insights/config'),
  create: (data) => api.post('/ai-insights/insights', data),
  update: (id, data) => api.put(`/ai-insights/insights/${id}`, data),
  delete: (id) => api.delete(`/ai-insights/insights/${id}`),
};

// Trading Bot
export const tradingAPI = {
  getMySchedules: () => api.get('/trading/schedules'),
  createSchedule: (data) => api.post('/trading/schedules', data),
  updateSchedule: (id, data) => api.put(`/trading/schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`/trading/schedules/${id}`),
  adminGetAll: (params) => api.get('/trading/admin/all', { params }),
};
