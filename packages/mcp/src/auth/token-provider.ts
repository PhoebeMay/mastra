/**
 * Token-based dynamic authentication for MCP with lifecycle management
 */

/**
 * Token metadata for advanced token lifecycle management
 */
export interface TokenInfo {
  /** The actual token value */
  token: string;
  /** When the token expires (absolute timestamp in milliseconds) */
  expiresAt?: number;
  /** How long the token is valid (in milliseconds from now) */
  expiresInMs?: number;
  /** Optional token type (defaults to 'Bearer') */
  type?: string;
}

/**
 * Token provider response - can be a simple string or detailed token info
 */
export type TokenResponse = string | TokenInfo;

/**
 * Token provider function - returns token string or token metadata
 *
 * For backward compatibility, returning a string works as before.
 * For advanced features like proactive refresh, return TokenInfo with expiration data.
 */
export type TokenProvider = () => Promise<TokenResponse> | TokenResponse;

/**
 * Utility to normalize token response to TokenInfo
 */
export function normalizeTokenResponse(response: TokenResponse): TokenInfo {
  if (typeof response === 'string') {
    return { token: response, type: 'Bearer' };
  }
  return {
    type: 'Bearer',
    ...response,
  };
}

/**
 * Utility to check if a token is expired or expiring soon
 */
export function isTokenExpired(tokenInfo: TokenInfo, bufferMs: number = 30000): boolean {
  if (tokenInfo.expiresAt) {
    return Date.now() + bufferMs >= tokenInfo.expiresAt;
  }
  return false;
}

/**
 * Calculate absolute expiration time from relative expiration
 */
export function calculateExpirationTime(tokenInfo: TokenInfo, issuedAt: number = Date.now()): TokenInfo {
  if (tokenInfo.expiresInMs && !tokenInfo.expiresAt) {
    return {
      ...tokenInfo,
      expiresAt: issuedAt + tokenInfo.expiresInMs,
    };
  }
  return tokenInfo;
}
