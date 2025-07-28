/**
 * Simple token-based dynamic authentication for MCP
 */

export type AuthProvider = () => Promise<string> | string;

/**
 * Create a token provider that refreshes automatically
 */
export function createTokenProvider(
  getToken: () => Promise<string> | string,
  refreshIntervalMs: number = 15 * 60 * 1000, // 15 minutes default
): AuthProvider {
  let cachedToken: string | null = null;
  let lastRefresh = 0;

  return async () => {
    const now = Date.now();

    if (!cachedToken || now - lastRefresh >= refreshIntervalMs) {
      cachedToken = await getToken();
      lastRefresh = now;
    }

    return cachedToken;
  };
}
