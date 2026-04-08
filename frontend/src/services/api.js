const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('jblk_token');
}

async function apiRequest(method, path, data = null) {
  const headers = { 'Content-Type': 'application/json' };
  const tok = getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;

  const opts = { method, headers };
  if (data && method !== 'GET') opts.body = JSON.stringify(data);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`);
  return json;
}

export const auth = {
  login: (email, password) => apiRequest('POST', '/auth/login', { email, password }),
  register: (data) => apiRequest('POST', '/auth/register', data),
  me: () => apiRequest('GET', '/auth/me'),
  logout: () => apiRequest('POST', '/auth/logout'),
};

export const wallet = {
  getBalances: () => apiRequest('GET', '/wallet/balances'),
  getTransactions: (params = '') => apiRequest('GET', `/wallet/transactions${params}`),
  send: (data) => apiRequest('POST', '/wallet/send', data),
  getAddress: (currency) => apiRequest('GET', `/wallet/address/${currency}`),
  deposit: (data) => apiRequest('POST', '/wallet/deposit', data),
  withdraw: (data) => apiRequest('POST', '/wallet/withdraw', data),
};

export const marketplace = {
  getProducts: (params = '') => apiRequest('GET', `/marketplace/products${params}`),
  getProduct: (id) => apiRequest('GET', `/marketplace/products/${id}`),
  getCategories: () => apiRequest('GET', '/marketplace/categories'),
  addToCart: (data) => apiRequest('POST', '/marketplace/cart', data),
  getCart: () => apiRequest('GET', '/marketplace/cart'),
  updateCart: (id, data) => apiRequest('PUT', `/marketplace/cart/${id}`, data),
  removeFromCart: (id) => apiRequest('DELETE', `/marketplace/cart/${id}`),
  checkout: (data) => apiRequest('POST', '/marketplace/checkout', data),
  applyCoupon: (code) => apiRequest('POST', '/marketplace/coupon', { code }),
  getOrders: () => apiRequest('GET', '/marketplace/orders'),
  getOrder: (id) => apiRequest('GET', `/marketplace/orders/${id}`),
};

export const mining = {
  getRigs: (params = '') => apiRequest('GET', `/mining/rigs${params}`),
  getRig: (id) => apiRequest('GET', `/mining/rigs/${id}`),
  rentRig: (data) => apiRequest('POST', '/mining/rent', data),
  getContracts: () => apiRequest('GET', '/mining/contracts'),
  getContract: (id) => apiRequest('GET', `/mining/contracts/${id}`),
  getEarnings: () => apiRequest('GET', '/mining/earnings'),
  getStats: () => apiRequest('GET', '/mining/stats'),
};

export const admin = {
  getStats: () => apiRequest('GET', '/admin/stats'),
  getUsers: (params = '') => apiRequest('GET', `/admin/users${params}`),
  updateUser: (id, data) => apiRequest('PUT', `/admin/users/${id}`, data),
  getMiningRigs: () => apiRequest('GET', '/admin/mining/rigs'),
  createRig: (data) => apiRequest('POST', '/admin/mining/rigs', data),
  updateRig: (id, data) => apiRequest('PUT', `/admin/mining/rigs/${id}`, data),
  getPendingProducts: () => apiRequest('GET', '/admin/marketplace/pending'),
  approveProduct: (id) => apiRequest('POST', `/admin/marketplace/products/${id}/approve`),
  rejectProduct: (id) => apiRequest('POST', `/admin/marketplace/products/${id}/reject`),
  getSettings: () => apiRequest('GET', '/admin/settings'),
  updateSettings: (data) => apiRequest('PUT', '/admin/settings', data),
  getWithdrawMode: () => apiRequest('GET', '/admin/settings/withdraw-mode'),
  setWithdrawMode: (mode) => apiRequest('POST', '/admin/settings/withdraw-mode', { mode }),
  getPendingWithdrawals: () => apiRequest('GET', '/admin/withdrawals/pending'),
  approveWithdrawal: (id) => apiRequest('POST', `/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id) => apiRequest('POST', `/admin/withdrawals/${id}/reject`),
  getActivity: () => apiRequest('GET', '/admin/activity'),
};

export const seller = {
  getStats: () => apiRequest('GET', '/seller/stats'),
  getProducts: () => apiRequest('GET', '/seller/products'),
  createProduct: (data) => apiRequest('POST', '/seller/products', data),
  updateProduct: (id, data) => apiRequest('PUT', `/seller/products/${id}`, data),
  deleteProduct: (id) => apiRequest('DELETE', `/seller/products/${id}`),
  getOrders: () => apiRequest('GET', '/seller/orders'),
  fulfillOrder: (id) => apiRequest('POST', `/seller/orders/${id}/fulfill`),
  getPayouts: () => apiRequest('GET', '/seller/payouts'),
};

export const referral = {
  getStats: () => apiRequest('GET', '/referrals/stats'),
  getReferrals: () => apiRequest('GET', '/referrals'),
  getLink: () => apiRequest('GET', '/referrals/link'),
};
