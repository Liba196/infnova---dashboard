const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://infnova-intern.vercel.app/api';

export class ApiError extends Error {
  status: number;
  isSessionExpired: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // Treat 401 as the expired/invalid-session signal. If the real API
    // uses a different status or a body flag for this, adjust here —
    // this is the single choke point every protected call runs through.
    this.isSessionExpired = status === 401;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new ApiError(message, res.status);
  }

  // handle empty responses (e.g. 204 on some PATCH endpoints)
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),
};
