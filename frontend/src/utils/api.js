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

// Legal
export const legalAPI = {
  getDashboard: () => api.get('/legal/dashboard'),
  // Team
  getTeam: (params) => api.get('/legal/team', { params }),
  addTeamMember: (data) => api.post('/legal/team', data),
  updateTeamMember: (id, data) => api.put(`/legal/team/${id}`, data),
  deleteTeamMember: (id) => api.delete(`/legal/team/${id}`),
  // Tickets
  getTickets: (params) => api.get('/legal/tickets', { params }),
  getTicket: (id) => api.get(`/legal/tickets/${id}`),
  createTicket: (data) => api.post('/legal/tickets', data),
  updateTicket: (id, data) => api.put(`/legal/tickets/${id}`, data),
  addTicketMessage: (id, data) => api.post(`/legal/tickets/${id}/message`, data),
  // Documents
  getDocuments: (params) => api.get('/legal/documents', { params }),
  getDocument: (id) => api.get(`/legal/documents/${id}`),
  createDocument: (data) => api.post('/legal/documents', data),
  updateDocument: (id, data) => api.put(`/legal/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/legal/documents/${id}`),
  downloadDocument: (id) => api.post(`/legal/documents/${id}/download`),
  // Alerts
  getAlerts: (params) => api.get('/legal/alerts', { params }),
  createAlert: (data) => api.post('/legal/alerts', data),
  resolveAlert: (id, data) => api.patch(`/legal/alerts/${id}/resolve`, data),
  markAlertRead: (id) => api.patch(`/legal/alerts/${id}/read`),
  // Calendar
  getCalendar: (params) => api.get('/legal/calendar', { params }),
  createEvent: (data) => api.post('/legal/calendar', data),
  updateEvent: (id, data) => api.put(`/legal/calendar/${id}`, data),
  completeEvent: (id, data) => api.patch(`/legal/calendar/${id}/complete`, data),
  deleteEvent: (id) => api.delete(`/legal/calendar/${id}`),
  // Audit Log
  getAuditLog: (params) => api.get('/legal/audit-log', { params }),
};
