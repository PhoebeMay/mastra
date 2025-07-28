import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TokenProvider, TokenInfo } from './token-provider';
import { normalizeTokenResponse, isTokenExpired, calculateExpirationTime } from './token-provider';

describe('Auth Provider Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('TokenProvider type', () => {
    it('should handle async token functions', async () => {
      const tokenProvider: TokenProvider = vi.fn().mockResolvedValue('async-token');

      const token = await tokenProvider();
      expect(token).toBe('async-token');
      expect(tokenProvider).toHaveBeenCalledTimes(1);
    });

    it('should handle sync token functions', async () => {
      const tokenProvider: TokenProvider = vi.fn().mockReturnValue('sync-token');

      const token = await tokenProvider();
      expect(token).toBe('sync-token');
      expect(tokenProvider).toHaveBeenCalledTimes(1);
    });

    it('should handle token provider that returns promises', async () => {
      const tokenProvider: TokenProvider = () => Promise.resolve('promise-token');

      const token = await tokenProvider();
      expect(token).toBe('promise-token');
    });

    it('should handle token provider that returns strings directly', async () => {
      const tokenProvider: TokenProvider = () => 'direct-token';

      const token = await tokenProvider();
      expect(token).toBe('direct-token');
    });

    it('should handle token provider that returns TokenInfo objects', async () => {
      const tokenInfo: TokenInfo = {
        token: 'info-token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        type: 'Bearer',
      };
      const tokenProvider: TokenProvider = () => Promise.resolve(tokenInfo);

      const response = await tokenProvider();
      expect(response).toEqual(tokenInfo);
    });

    it('should handle token provider that returns TokenInfo with relative expiration', async () => {
      const tokenInfo: TokenInfo = {
        token: 'relative-token',
        expiresInMs: 3600000, // 1 hour
      };
      const tokenProvider: TokenProvider = () => tokenInfo;

      const response = await tokenProvider();
      expect(response).toEqual(tokenInfo);
    });
  });

  describe('normalizeTokenResponse', () => {
    it('should convert string token to TokenInfo', () => {
      const result = normalizeTokenResponse('simple-token');
      expect(result).toEqual({
        token: 'simple-token',
        type: 'Bearer',
      });
    });

    it('should preserve TokenInfo object with defaults', () => {
      const tokenInfo: TokenInfo = {
        token: 'detailed-token',
        expiresAt: Date.now() + 3600000,
      };
      const result = normalizeTokenResponse(tokenInfo);
      expect(result).toEqual({
        ...tokenInfo,
        type: 'Bearer',
      });
    });

    it('should preserve custom token type', () => {
      const tokenInfo: TokenInfo = {
        token: 'custom-token',
        type: 'Custom',
      };
      const result = normalizeTokenResponse(tokenInfo);
      expect(result).toEqual(tokenInfo);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for tokens without expiration', () => {
      const tokenInfo: TokenInfo = { token: 'no-expiry' };
      expect(isTokenExpired(tokenInfo)).toBe(false);
    });

    it('should return false for non-expired tokens', () => {
      const tokenInfo: TokenInfo = {
        token: 'valid-token',
        expiresAt: Date.now() + 3600000, // 1 hour in future
      };
      expect(isTokenExpired(tokenInfo)).toBe(false);
    });

    it('should return true for expired tokens', () => {
      const tokenInfo: TokenInfo = {
        token: 'expired-token',
        expiresAt: Date.now() - 1000, // 1 second ago
      };
      expect(isTokenExpired(tokenInfo)).toBe(true);
    });

    it('should consider buffer time when checking expiration', () => {
      const tokenInfo: TokenInfo = {
        token: 'soon-expired',
        expiresAt: Date.now() + 15000, // 15 seconds from now
      };
      expect(isTokenExpired(tokenInfo, 30000)).toBe(true); // 30 second buffer
      expect(isTokenExpired(tokenInfo, 10000)).toBe(false); // 10 second buffer
    });
  });

  describe('calculateExpirationTime', () => {
    it('should convert relative expiration to absolute', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const tokenInfo: TokenInfo = {
        token: 'relative-token',
        expiresInMs: 3600000,
      };

      const result = calculateExpirationTime(tokenInfo, now);
      expect(result).toEqual({
        ...tokenInfo,
        expiresAt: now + 3600000,
      });
    });

    it('should preserve existing absolute expiration', () => {
      const tokenInfo: TokenInfo = {
        token: 'absolute-token',
        expiresAt: Date.now() + 3600000,
        expiresInMs: 7200000, // Should be ignored
      };

      const result = calculateExpirationTime(tokenInfo);
      expect(result).toEqual(tokenInfo);
    });

    it('should use current time as default issued time', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const tokenInfo: TokenInfo = {
        token: 'default-time-token',
        expiresInMs: 1800000, // 30 minutes
      };

      const result = calculateExpirationTime(tokenInfo);
      expect(result.expiresAt).toBe(now + 1800000);
    });
  });
});
