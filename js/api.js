// Pequeno cliente para chamar o backend
const API_BASE = (window.API_BASE || 'http://localhost:3000').replace(/\/$/, '');

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Auth
async function rdLogin(email, password) {
  const r = await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
  localStorage.setItem('rd_token', r.token);
  return r;
}

async function rdRegister(email, password, name) {
  const r = await apiRequest('/api/auth/register', { method: 'POST', body: { email, password, name } });
  localStorage.setItem('rd_token', r.token);
  return r;
}

async function rdMe() {
  const token = localStorage.getItem('rd_token');
  if (!token) return null;
  try {
    const r = await apiRequest('/api/me', { token });
    return r.user;
  } catch (_) {
    return null;
  }
}

// Favoritos
async function rdGetFavorites() {
  const token = localStorage.getItem('rd_token');
  if (!token) throw new Error('Auth requerida');
  return apiRequest('/api/favorites', { token });
}

async function rdAddFavorite({ item_key, item_type, title, url, image_url }) {
  const token = localStorage.getItem('rd_token');
  if (!token) throw new Error('Auth requerida');
  return apiRequest('/api/favorites', {
    method: 'POST',
    token,
    body: { item_key, item_type, title, url, image_url },
  });
}

async function rdRemoveFavorite(id) {
  const token = localStorage.getItem('rd_token');
  if (!token) throw new Error('Auth requerida');
  return apiRequest(`/api/favorites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}

async function rdRemoveFavoriteByKey({ item_key, item_type }) {
  const token = localStorage.getItem('rd_token');
  if (!token) throw new Error('Auth requerida');
  const path = `/api/favorites/by-key/${encodeURIComponent(item_type)}/${encodeURIComponent(item_key)}`;
  return apiRequest(path, { method: 'DELETE', token });
}

// Hotéis
async function rdGetHotelOptions(slug) {
  return apiRequest(`/api/hotels/${encodeURIComponent(slug)}/options`);
}

async function rdAddHotelOption(slug, payload) {
  const token = localStorage.getItem('rd_token');
  if (!token) throw new Error('Auth requerida');
  return apiRequest(`/api/hotels/${encodeURIComponent(slug)}/options`, {
    method: 'POST',
    token,
    body: payload,
  });
}

// Log de busca
async function rdLogSearch({ query_text, cidade }) {
  return apiRequest('/api/search-logs', {
    method: 'POST',
    body: { query_text, cidade },
  });
}

window.RightDestinyAPI = {
  rdLogin,
  rdRegister,
  rdMe,
  rdGetFavorites,
  rdAddFavorite,
  rdRemoveFavorite,
  rdRemoveFavoriteByKey,
  rdLogSearch,
  rdGetHotelOptions,
  rdAddHotelOption,
};
