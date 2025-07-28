import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TokenProvider } from './token-provider';

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
  });
});
