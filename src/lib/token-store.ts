// In-memory access token (lost on reload — restored via /auth/refresh on mount).
// Kept outside React so the API client can read it anywhere.
let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;
export const setAccessToken = (t: string | null): void => {
  accessToken = t;
};
