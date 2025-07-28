/**
 * Simple function-based dynamic authentication for MCP
 */

export type TokenProvider = () => Promise<string> | string;
export type HeaderProvider = () => Promise<Record<string, string>> | Record<string, string>;

/**
 * Create a token provider that refreshes automatically
 */
export function createTokenProvider(
  getToken: () => Promise<string> | string,
  refreshIntervalMs: number = 15 * 60 * 1000, // 15 minutes default
): TokenProvider {
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

/**
 * Create a Bearer token header provider
 */
export function createBearerTokenProvider(
  getToken: () => Promise<string> | string,
  refreshIntervalMs?: number,
): HeaderProvider {
  const tokenProvider = createTokenProvider(getToken, refreshIntervalMs);

  return async () => {
    const token = await tokenProvider();
    return {
      Authorization: `Bearer ${token}`,
    };
  };
}
