/**
 * Adapter to bridge Mastra's TokenProvider to MCP SDK's OAuthClientProvider
 */

import type {
  OAuthClientProvider,
  OAuthClientMetadata,
  OAuthClientInformation,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/client/auth.js';
import type { TokenProvider, TokenInfo } from './token-provider';
import { normalizeTokenResponse, calculateExpirationTime } from './token-provider';

export interface TokenProviderAdapterOptions {
  /** Client ID for OAuth (optional) */
  clientId?: string;
  /** Client metadata (optional) */
  clientMetadata?: Partial<OAuthClientMetadata>;
  /** Redirect URL (required for OAuth flows) */
  redirectUrl?: string | URL;
}

/**
 * Adapts a Mastra TokenProvider to work with MCP SDK's OAuth system
 *
 * This enables per-request token refresh using the MCP SDK's built-in auth system
 */
export class TokenProviderAdapter implements OAuthClientProvider {
  private cachedTokens: OAuthTokens | null = null;
  private lastTokenFetch = 0;
  private readonly cacheExpiryMs = 5000; // 5 second cache to avoid excessive calls

  constructor(
    private readonly tokenProvider: TokenProvider,
    private readonly options: TokenProviderAdapterOptions = {},
  ) {
    if (!this.options.redirectUrl) {
      this.options.redirectUrl = 'http://localhost:3000/auth/callback';
    }
  }

  get redirectUrl(): string | URL {
    return this.options.redirectUrl!;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: 'Mastra MCP Client',
      client_uri: 'https://mastra.ai',
      redirect_uris: [this.redirectUrl.toString()],
      ...this.options.clientMetadata,
    };
  }

  async state(): Promise<string> {
    return Math.random().toString(36).substring(2, 15);
  }

  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    return {
      client_id: this.options.clientId || 'mastra-mcp-client',
      ...this.clientMetadata,
    };
  }

  /**
   * This is the key method - called by MCP SDK for every request
   * Returns fresh tokens from our TokenProvider
   */
  async tokens(): Promise<OAuthTokens | undefined> {
    const now = Date.now();

    // Use short cache to avoid excessive token provider calls
    if (this.cachedTokens && now - this.lastTokenFetch < this.cacheExpiryMs) {
      return this.cachedTokens;
    }

    try {
      const tokenResponse = await this.tokenProvider();
      const tokenInfo = normalizeTokenResponse(tokenResponse);
      const normalizedToken = calculateExpirationTime(tokenInfo);

      // Convert to OAuth format
      const oauthTokens: OAuthTokens = {
        access_token: normalizedToken.token,
        token_type: normalizedToken.type || 'Bearer',
        expires_in: normalizedToken.expiresAt ? Math.floor((normalizedToken.expiresAt - Date.now()) / 1000) : undefined,
        // We don't have refresh tokens in our simple model
        refresh_token: undefined,
      };

      this.cachedTokens = oauthTokens;
      this.lastTokenFetch = now;
      return oauthTokens;
    } catch (error) {
      console.error('Failed to get token from TokenProvider:', error);
      return undefined;
    }
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    // We don't save tokens as our TokenProvider handles that
    this.cachedTokens = tokens;
    this.lastTokenFetch = Date.now();
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    // In a real implementation, this would redirect the user to the auth URL
    // For now, we'll just log it as our simple TokenProvider doesn't use OAuth flows
    console.warn('OAuth redirect requested but TokenProvider is not OAuth-based:', authorizationUrl.toString());
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    // Not needed for token-based auth
  }

  async codeVerifier(): Promise<string> {
    // Return a dummy verifier since we're not using OAuth flows
    return 'not-used-in-token-provider-mode';
  }

  /**
   * Clear cached tokens to force refresh on next request
   */
  invalidateCache(): void {
    this.cachedTokens = null;
    this.lastTokenFetch = 0;
  }
}

/**
 * Helper to create a TokenProviderAdapter
 */
export function createTokenProviderAdapter(
  tokenProvider: TokenProvider,
  options?: TokenProviderAdapterOptions,
): TokenProviderAdapter {
  return new TokenProviderAdapter(tokenProvider, options);
}
