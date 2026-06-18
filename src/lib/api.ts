import { getAccessToken, setAccessToken } from "./token-store";
import { getActiveOrgId } from "./active-org";
import type { User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function rawFetch(path: string, options: RequestInit = {}, withAuth = true): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  // For SUPER_ADMIN viewing a specific org, scope every request via ?orgId.
  // (The backend ignores this for non-super users — their org comes from the JWT.)
  const orgId = getActiveOrgId();
  const finalPath = orgId != null ? `${path}${path.includes("?") ? "&" : "?"}orgId=${orgId}` : path;
  return fetch(`${API_URL}${finalPath}`, { ...options, headers, credentials: "include" });
}

/** Exchange the httpOnly refresh cookie for a fresh access token. */
export async function refreshAccessToken(): Promise<string | null> {
  const res = await rawFetch("/api/v1/auth/refresh", { method: "POST" }, false);
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await res.json()) as { accessToken: string };
  setAccessToken(data.accessToken);
  return data.accessToken;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: { error?: { message?: string; details?: unknown } } | null = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  return new ApiError(res.status, body?.error?.message ?? res.statusText, body?.error?.details);
}

/** Authenticated fetch with one transparent refresh-and-retry on 401. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, options);
  if (res.status === 401 && getAccessToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await rawFetch(path, options);
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body != null ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  /** multipart upload (FormData) */
  upload: <T>(path: string, form: FormData) => apiFetch<T>(path, { method: "POST", body: form }),
};

export async function loginRequest(email: string, password: string): Promise<User> {
  const res = await rawFetch(
    "/api/v1/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as { accessToken: string; user: User };
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await rawFetch("/api/v1/auth/logout", { method: "POST" }, false).catch(() => undefined);
  setAccessToken(null);
}

export { API_URL };
