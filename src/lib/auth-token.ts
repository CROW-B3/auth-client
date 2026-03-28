const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
let pendingTokenRequest: Promise<string | null> | null = null;

export const getAuthToken = async (): Promise<string | null> => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = (async () => {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/token`, {
        credentials: "include",
      });

      if (!response.ok) {
        cachedToken = null;
        tokenExpiry = null;
        return null;
      }

      const data = await response.json() as { token: string; expiresAt?: number };
      cachedToken = data.token;
      tokenExpiry = data.expiresAt ? data.expiresAt * 1000 : Date.now() + 3600000;
      return cachedToken;
    } catch {
      cachedToken = null;
      tokenExpiry = null;
      return null;
    } finally {
      pendingTokenRequest = null;
    }
  })();

  return pendingTokenRequest;
};

export const clearAuthToken = () => {
  cachedToken = null;
  tokenExpiry = null;
};

export const createAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const handleAuthResponse = (response: Response): void => {
  if (response.status === 401) {
    clearAuthToken();
  }
};
