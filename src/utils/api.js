// src/utils/api.js
export const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

export function getToken() {
  if (typeof window === 'undefined') return '';
  const t = localStorage.getItem('token') || '';
  return t.replace(/^"|"$/g, '');
}

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// safe JSON parse helper
function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // return raw text so caller can see what backend sent
    throw new Error(`Invalid JSON. Body starts: ${text.slice(0, 160)}`);
  }
}

// Fetch wrapper that:
// - prefixes API_BASE_URL
// - attaches Bearer token
// - sets JSON headers when appropriate
// - throws helpful errors (instead of "Unexpected token <")
export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  // If sending a plain JS object, user probably forgot to JSON.stringify
  // (We won’t auto-convert to avoid surprises; just warn in console)
  if (options.body && !isFormData && typeof options.body === 'object' && !(options.body instanceof String)) {
    // If it's already a string, fine. If it's an object, it's likely a mistake.
    // This is a soft hint, not a hard error.
    // eslint-disable-next-line no-console
    console.warn('apiFetch: options.body is an object. Did you mean JSON.stringify(...) ?');
  }

  // Only set JSON content-type when NOT FormData and caller didn't set it
  if (!isFormData && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(apiUrl(path), { ...options, headers });

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!res.ok) {
    // Try to display backend errors even if not JSON
    const bodyPreview = text.slice(0, 300);
    throw new Error(`HTTP ${res.status}: ${bodyPreview}`);
  }

  // Allow empty responses
  if (!text) return null;

  // If backend returns JSON, parse it; otherwise return text
  if (contentType.includes('application/json')) {
    return safeParseJson(text);
  }

  return text;
}
