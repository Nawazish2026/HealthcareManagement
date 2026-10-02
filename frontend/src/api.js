const API_BASE = '/api/v1';

export const getAuthToken = () => localStorage.getItem('eve_auth_token');
export const setAuthToken = (token) => localStorage.setItem('eve_auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('eve_auth_token');

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('eve_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem('eve_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('eve_user');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || data?.message || 'An unexpected error occurred';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  signup: (payload) => request(`${API_BASE}/auth/signup`, { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request(`${API_BASE}/auth/login`, { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request(`${API_BASE}/auth/me`),

  // Centres & Tests
  getCentres: (params = '') => request(`${API_BASE}/centres${params ? `?${params}` : ''}`),
  getCentreById: (id) => request(`${API_BASE}/centres/${id}`),
  getTests: () => request(`${API_BASE}/tests`),

  // Bookings
  createBooking: (payload) => request(`${API_BASE}/bookings`, { method: 'POST', body: JSON.stringify(payload) }),
  getBookings: (params = '') => request(`${API_BASE}/bookings${params ? `?${params}` : ''}`),
  getBookingById: (id) => request(`${API_BASE}/bookings/${id}`),
  cancelBooking: (id) => request(`${API_BASE}/bookings/${id}/cancel`, { method: 'POST' }),

  // Payments (mounted at both /payments and /api/v1/payments)
  simulatePayment: (payload) => request('/payments', { method: 'POST', body: JSON.stringify(payload) }),
  sendWebhook: (payload) => request('/payments/webhook', { method: 'POST', body: JSON.stringify(payload) }),
};
