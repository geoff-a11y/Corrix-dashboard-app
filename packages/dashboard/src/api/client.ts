// In production, use the full API URL. In development, use relative path (proxied by Vite)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

type ParamsValue = string | number | boolean | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryParams = Record<string, ParamsValue> | { [key: string]: any };

interface RequestOptions extends RequestInit {
  params?: QueryParams;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private buildUrl(path: string, params?: QueryParams): string {
    // Handle external URLs (production) vs relative paths (development)
    const isExternalUrl = this.baseUrl.startsWith('http://') || this.baseUrl.startsWith('https://');
    const fullUrl = isExternalUrl
      ? `${this.baseUrl}${path}`
      : `${window.location.origin}${this.baseUrl}${path}`;

    const url = new URL(fullUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const api = new ApiClient(API_BASE);
