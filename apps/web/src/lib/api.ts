/**
 * Resolves the target API URL for an endpoint.
 *
 * 1. Server-side runtime (e.g. Next.js Server Components, Server Actions, Route Handlers):
 *    Uses the Vercel Service Binding `process.env.API_URL` injected by Vercel:
 *    new URL(cleanEndpoint, process.env.API_URL)
 *
 * 2. Client-side runtime (Browser):
 *    - Uses NEXT_PUBLIC_API_URL if explicitly provided.
 *    - Falls back to same-origin relative `/api/...` on Vercel (routed to the `api` service via top-level rewrites).
 *    - Falls back to `http://localhost:5000` when running locally outside of Vercel dev.
 */
export function resolveApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Server-side (functions / SSR / Server Actions)
  if (typeof window === 'undefined') {
    const internalUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return new URL(cleanEndpoint, internalUrl.endsWith('/') ? internalUrl : `${internalUrl}/`).toString();
  }

  // Client-side with explicit public base URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.endsWith('/')
      ? process.env.NEXT_PUBLIC_API_URL.slice(0, -1)
      : process.env.NEXT_PUBLIC_API_URL;
    return `${base}/${cleanEndpoint}`;
  }

  // Local development standalone fallback (web:3000 calling api:5000)
  if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    return `http://localhost:5000/${cleanEndpoint}`;
  }

  // Same-origin Vercel deployment / Vercel dev (public rewrite routes /api/(.*) -> api service)
  return cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`;
}

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('nd_access_token');
    }
  }

  setToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('nd_access_token', token);
        sessionStorage.setItem('nd_session_active', 'true');
      } else {
        localStorage.removeItem('nd_access_token');
        sessionStorage.removeItem('nd_session_active');
      }
    }
  }

  setRefreshToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('nd_refresh_token', token);
      } else {
        localStorage.removeItem('nd_refresh_token');
      }
    }
  }

  getToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('nd_access_token');
    }
    return this.accessToken;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = resolveApiUrl(endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // for HttpOnly refresh cookie
      });

      // Handle 401: Try token refresh once
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error ${retryRes.status}`);
          }
          return retryRes.json();
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      return response.json();
    } catch (err: any) {
      console.error(`API request failed [${endpoint}]:`, err);
      throw err;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('nd_refresh_token') : null;
      const res = await fetch(resolveApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          this.setToken(data.accessToken);
          if (data.refreshToken) {
            this.setRefreshToken(data.refreshToken);
          }
          return true;
        }
      }
      this.setToken(null);
      this.setRefreshToken(null);
      return false;
    } catch {
      this.setToken(null);
      this.setRefreshToken(null);
      return false;
    }
  }

  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
