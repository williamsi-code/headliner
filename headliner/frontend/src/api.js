const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'headliner-token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
}

function localDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function api(path, { method = 'GET', body, parentPin } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-Local-Date': localDate() };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (parentPin) headers['X-Parent-Pin'] = parentPin;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your internet and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) setToken(null);
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const fmt = (n) => Number(n || 0).toLocaleString();
