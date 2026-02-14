const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export const getAuthToken = async (): Promise<string | null> => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

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
  }
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
