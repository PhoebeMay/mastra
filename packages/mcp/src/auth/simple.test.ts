import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTokenProvider, createBearerTokenProvider } from './simple';

describe('Dynamic Auth Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Date.now for consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createTokenProvider', () => {
    it('should return cached token within refresh interval', async () => {
      const getToken = vi.fn().mockResolvedValue('token123');
      const provider = createTokenProvider(getToken, 900000); // 15 minutes

      const token1 = await provider();
      const token2 = await provider();

      expect(token1).toBe('token123');
      expect(token2).toBe('token123');
      expect(getToken).toHaveBeenCalledTimes(1);
    });

    it('should refresh token after interval expires', async () => {
      const getToken = vi.fn().mockResolvedValueOnce('token1').mockResolvedValueOnce('token2');

      const provider = createTokenProvider(getToken, 900000); // 15 minutes

      const token1 = await provider();
      expect(token1).toBe('token1');

      // Advance time past refresh interval
      vi.advanceTimersByTime(900001);

      const token2 = await provider();
      expect(token2).toBe('token2');
      expect(getToken).toHaveBeenCalledTimes(2);
    });

    it('should handle sync token functions', async () => {
      const getToken = vi.fn().mockReturnValue('sync-token');
      const provider = createTokenProvider(getToken, 900000);

      const token = await provider();
      expect(token).toBe('sync-token');
      expect(getToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('createBearerTokenProvider', () => {
    it('should return Authorization header with Bearer prefix', async () => {
      const getToken = vi.fn().mockResolvedValue('my-access-token');
      const provider = createBearerTokenProvider(getToken);

      const headers = await provider();

      expect(headers).toEqual({
        Authorization: 'Bearer my-access-token',
      });
    });

    it('should use custom refresh interval', async () => {
      const getToken = vi.fn().mockResolvedValueOnce('token1').mockResolvedValueOnce('token2');

      const provider = createBearerTokenProvider(getToken, 600000); // 10 minutes

      await provider();

      // Advance time by 10 minutes + 1ms
      vi.advanceTimersByTime(600001);

      await provider();

      expect(getToken).toHaveBeenCalledTimes(2);
    });
  });
});
