// client/src/utils/api.js
export const API_BASE = process.env.REACT_APP_API_BASE || "";

export function apiUrl(path) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path; // don't prefix absolute URLs
  return `${API_BASE}${path}`;
}

export function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const opts = { credentials: "include", ...options };
  return fetch(url, opts);
}
