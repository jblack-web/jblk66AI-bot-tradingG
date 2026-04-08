import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Membership
export const getMembership = () => api.get('/membership');
export const upgradeMembership = (tier) => api.post('/membership/upgrade', { tier });

// Trading
export const getPositions = () => api.get('/trading/positions');
export const openPosition = (data) => api.post('/trading/positions', data);
export const closePosition = (id) => api.delete(`/trading/positions/${id}`);
export const getTradeHistory = () => api.get('/trading/history');
export const getPrices = () => api.get('/trading/prices');
export const buyOption = (data) => api.post('/trading/options', data);

// Earnings
export const getEarnings = () => api.get('/earnings');
export const getTransactions = () => api.get('/earnings/transactions');

// Referral
export const getReferral = () => api.get('/referral');

// Admin
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const updateUserTier = (id, tier) => api.put(`/admin/users/${id}/tier`, { tier });
export const extendTrial = (id, days) => api.post(`/admin/users/${id}/extend-trial`, { days });
export const getAdminAnalytics = (params) => api.get('/admin/analytics', { params });
export const getPromotions = () => api.get('/admin/promotions');
export const createPromotion = (data) => api.post('/admin/promotions', data);
export const updatePromotion = (id, data) => api.put(`/admin/promotions/${id}`, data);
export const deletePromotion = (id) => api.delete(`/admin/promotions/${id}`);

export default api;
