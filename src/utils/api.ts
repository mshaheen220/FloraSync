export const getApiBaseUrl = (): string => {
  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  return ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const apiBase = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${apiBase}${path}`;

  const headers = new Headers(options.headers);
  
  // Auto-attach the Authorization token if the user is logged in
  if (!headers.has('Authorization')) {
    const token = localStorage.getItem('florasync_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto-set Content-Type to JSON if the payload is a string (ignores FormData)
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
};