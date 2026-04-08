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
  me: () => apiRequest('GET', '/auth/profile'),
};

export const wallet = {
  getWallet: () => apiRequest('GET', '/wallet'),
  getBalances: () => apiRequest('GET', '/wallet/balance'),
  getTransactions: (params = '') => apiRequest('GET', `/wallet/transactions${params}`),
  send: (data) => apiRequest('POST', '/wallet/send', data),
  getReceiveInfo: () => apiRequest('GET', '/wallet/receive'),
  deposit: (data) => apiRequest('POST', '/wallet/deposit', data),
  withdraw: (data) => apiRequest('POST', '/wallet/withdraw', data),
};

export const marketplace = {
  getProducts: (params = '') => apiRequest('GET', `/marketplace/products${params}`),
  getProduct: (id) => apiRequest('GET', `/marketplace/products/${id}`),
  getCategories: () => apiRequest('GET', '/marketplace/categories'),
  getFeatured: () => apiRequest('GET', '/marketplace/featured'),
  addToCart: (data) => apiRequest('POST', '/marketplace/cart/add', data),
  getCart: () => apiRequest('GET', '/marketplace/cart'),
  updateCart: (itemId, data) => apiRequest('PUT', `/marketplace/cart/items/${itemId}`, data),
  removeFromCart: (itemId) => apiRequest('DELETE', `/marketplace/cart/items/${itemId}`),
  clearCart: () => apiRequest('DELETE', '/marketplace/cart'),
  createOrder: (data) => apiRequest('POST', '/marketplace/orders', data),
  applyCoupon: (code) => apiRequest('POST', '/marketplace/cart/coupon', { code }),
  getOrders: () => apiRequest('GET', '/marketplace/orders'),
  getOrder: (id) => apiRequest('GET', `/marketplace/orders/${id}`),
  cancelOrder: (id) => apiRequest('POST', `/marketplace/orders/${id}/cancel`),
  trackOrder: (id) => apiRequest('GET', `/marketplace/orders/${id}/track`),
};

export const mining = {
  getRigs: (params = '') => apiRequest('GET', `/mining/rigs${params}`),
  getRig: (id) => apiRequest('GET', `/mining/rigs/${id}`),
  rentRig: (data) => apiRequest('POST', '/mining/rent', data),
  getContracts: () => apiRequest('GET', '/mining/contracts'),
  getContract: (id) => apiRequest('GET', `/mining/contracts/${id}`),
  pauseContract: (id) => apiRequest('PUT', `/mining/contracts/${id}/pause`),
  resumeContract: (id) => apiRequest('PUT', `/mining/contracts/${id}/resume`),
  cancelContract: (id) => apiRequest('DELETE', `/mining/contracts/${id}`),
  getDashboard: () => apiRequest('GET', '/mining/dashboard'),
  getEarnings: () => apiRequest('GET', '/mining/earnings'),
  calculate: (data) => apiRequest('POST', '/mining/calculate', data),
  updatePool: (id, pool) => apiRequest('PUT', `/mining/contracts/${id}/pool`, { pool }),
};

export const admin = {
  getDashboard: () => apiRequest('GET', '/admin/dashboard'),
  getUsers: (params = '') => apiRequest('GET', `/admin/users${params}`),
  getUser: (id) => apiRequest('GET', `/admin/users/${id}`),
  updateUser: (id, data) => apiRequest('PUT', `/admin/users/${id}`, data),
  suspendUser: (id) => apiRequest('POST', `/admin/users/${id}/suspend`),
  getMiningRigs: () => apiRequest('GET', '/admin/rigs'),
  createRig: (data) => apiRequest('POST', '/admin/rigs', data),
  updateRig: (id, data) => apiRequest('PUT', `/admin/rigs/${id}`, data),
  getMiningStats: () => apiRequest('GET', '/admin/mining-stats'),
  getMarketplaceStats: () => apiRequest('GET', '/admin/marketplace-stats'),
  getSettings: () => apiRequest('GET', '/admin/settings'),
  updateSettings: (data) => apiRequest('PUT', '/admin/settings', data),
  getWithdrawMode: () => apiRequest('GET', '/admin/withdraw-mode'),
  setWithdrawMode: (mode) => apiRequest('PUT', '/admin/withdraw-mode', { withdrawMode: mode }),
  getPendingWithdrawals: () => apiRequest('GET', '/admin/withdrawals/pending'),
  processWithdrawal: (walletId, txId, action, txHash) =>
    apiRequest('PUT', `/admin/withdrawals/${walletId}/${txId}/process`, { action, txHash }),
  getRevenue: () => apiRequest('GET', '/admin/revenue'),
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
  getStats: () => apiRequest('GET', '/referral/stats'),
  getReferrals: () => apiRequest('GET', '/referral'),
  getLink: () => apiRequest('GET', '/referral/link'),
};
