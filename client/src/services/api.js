const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || '/api'
).replace(/\/$/, '');
async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();


  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned invalid JSON');
    }
  }

  if (!res.ok) {
    console.log('API error status:', res.status);
    console.log('API error data:', data);

    throw new Error(
      data?.error || data?.message || `Request failed with status ${res.status}`
    );
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

const cache = new Map();

export async function getCached(path, ttlMs = 30000) {
  const cached = cache.get(path);

  if (cached && Date.now() - cached.time < ttlMs) {
    return cached.data;
  }

  const data = await api.get(path);

  cache.set(path, {
    data,
    time: Date.now(),
  });

  return data;
}

export function clearApiCache(pathPrefix = '') {
  if (!pathPrefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) {
      cache.delete(key);
    }
  }
}