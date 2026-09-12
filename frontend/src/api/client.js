let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

let isRefreshing = false;
let refreshPromise = null;

const API_BASE = import.meta.env.VITE_API_URL || '';
const CLEAN_BASE = API_BASE.replace(/\/+$/, '');

export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // By default, allow credentials to send the HttpOnly refresh cookie
  const fetchOptions = {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  };

  const finalUrl = url.startsWith('http') ? url : `${CLEAN_BASE}${url}`;

  let response = await fetch(finalUrl, fetchOptions);

  // If 401 Unauthorized, and this wasn't an auth endpoint itself
  if (response.status === 401 && !url.includes('/api/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshUrl = `${CLEAN_BASE}/api/auth/refresh`;
      refreshPromise = fetch(refreshUrl, {
        method: 'POST',
        credentials: 'include',
      }).then(async (refreshResponse) => {
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAccessToken(data.access_token);
          return data.access_token;
        } else {
          setAccessToken(null);
          return null;
        }
      }).catch((error) => {
        setAccessToken(null);
        return null;
      }).finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      // Retry original request with new token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      fetchOptions.headers = headers;
      response = await fetch(finalUrl, fetchOptions);
    }
  }

  return response;
}
