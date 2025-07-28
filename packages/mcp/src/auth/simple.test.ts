import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTokenProvider } from './simple';

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

    it('should work with default 15 minute refresh interval', async () => {
      const getToken = vi.fn().mockResolvedValue('default-token');
      const provider = createTokenProvider(getToken); // No interval specified

      const token = await provider();
      expect(token).toBe('default-token');

      // Advance by 14 minutes - should use cache
      vi.advanceTimersByTime(14 * 60 * 1000);
      const cachedToken = await provider();
      expect(cachedToken).toBe('default-token');
      expect(getToken).toHaveBeenCalledTimes(1);

      // Advance past 15 minutes - should refresh
      vi.advanceTimersByTime(2 * 60 * 1000);
      await provider();
      expect(getToken).toHaveBeenCalledTimes(2);
    });
  });
});
