/**
 * Tests for supabaseRetry - Network resilience utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, rpcWithRetry, retryQuery, isTransientError } from '@/lib/supabaseRetry';

describe('supabaseRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isTransientError', () => {
    it('should identify network errors as transient', () => {
      expect(isTransientError(new Error('Load failed'))).toBe(true);
      expect(isTransientError(new Error('Failed to fetch'))).toBe(true);
      expect(isTransientError(new Error('Network request failed'))).toBe(true);
      expect(isTransientError(new Error('NetworkError when attempting to fetch'))).toBe(true);
      expect(isTransientError(new Error('net::ERR_CONNECTION_REFUSED'))).toBe(true);
      expect(isTransientError(new Error('ECONNRESET'))).toBe(true);
      expect(isTransientError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isTransientError(new Error('Request timeout'))).toBe(true);
      expect(isTransientError(new Error('Connection refused'))).toBe(true);
      expect(isTransientError(new Error('Connection reset'))).toBe(true);
      expect(isTransientError(new Error('socket hang up'))).toBe(true);
    });

    it('should not identify business errors as transient', () => {
      expect(isTransientError(new Error('User not found'))).toBe(false);
      expect(isTransientError(new Error('Permission denied'))).toBe(false);
      expect(isTransientError(new Error('Invalid email format'))).toBe(false);
      expect(isTransientError(new Error('Duplicate key violation'))).toBe(false);
    });

    it('should handle null/undefined errors', () => {
      expect(isTransientError(null)).toBe(false);
      expect(isTransientError(undefined)).toBe(false);
    });

    it('should handle error-like objects', () => {
      expect(isTransientError({ message: 'Failed to fetch' })).toBe(true);
      expect(isTransientError({ message: 'Some other error' })).toBe(false);
    });

    it('should handle string errors', () => {
      expect(isTransientError('Load failed')).toBe(true);
      expect(isTransientError('Permission denied')).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await withRetry(operation);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient error and succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('success after retry');

      const result = await withRetry(operation, { maxRetries: 2, baseDelayMs: 10 });
      expect(result).toBe('success after retry');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-transient error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Permission denied'));

      await expect(withRetry(operation, { maxRetries: 3, baseDelayMs: 10 }))
        .rejects.toThrow('Permission denied');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      await expect(withRetry(operation, { maxRetries: 2, baseDelayMs: 10 }))
        .rejects.toThrow('Failed to fetch');
      expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('ok');

      await withRetry(operation, { maxRetries: 2, baseDelayMs: 10, onRetry });
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should detect transient errors in Supabase response objects', async () => {
      const operation = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Load failed' },
      });

      // This should be retried because the error inside the response is transient
      await expect(
        withRetry(operation, { maxRetries: 1, baseDelayMs: 10 })
      ).rejects.toThrow('Load failed');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect maxDelayMs cap', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('ok');

      const start = Date.now();
      await withRetry(operation, {
        maxRetries: 3,
        baseDelayMs: 10,
        maxDelayMs: 50,
      });
      const elapsed = Date.now() - start;

      // Should be reasonably fast since delays are capped
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('rpcWithRetry', () => {
    it('should return Supabase-format result on success', async () => {
      const rpcCall = vi.fn().mockResolvedValue({ data: 'Admin', error: null });
      const result = await rpcWithRetry(rpcCall);
      expect(result.data).toBe('Admin');
      expect(result.error).toBeNull();
    });

    it('should retry on transient RPC error', async () => {
      const rpcCall = vi.fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Load failed' } })
        .mockResolvedValue({ data: 'Admin', error: null });

      const result = await rpcWithRetry(rpcCall, { maxRetries: 2, baseDelayMs: 10 });
      expect(result.data).toBe('Admin');
      expect(rpcCall).toHaveBeenCalledTimes(2);
    });

    it('should return error format on non-transient failure', async () => {
      const rpcCall = vi.fn().mockRejectedValue(new Error('Permission denied'));
      const result = await rpcWithRetry(rpcCall, { maxRetries: 2, baseDelayMs: 10 });
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Permission denied');
    });
  });

  describe('retryQuery', () => {
    it('should return query result on success', async () => {
      const queryFactory = vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Test' }],
        error: null,
      });

      const result = await retryQuery(queryFactory);
      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });

    it('should retry transient query errors', async () => {
      const queryFactory = vi.fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch' } })
        .mockResolvedValue({ data: [{ id: '1' }], error: null });

      const result = await retryQuery(queryFactory, { maxRetries: 2, baseDelayMs: 10 });
      expect(result.data).toHaveLength(1);
      expect(queryFactory).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-transient query errors', async () => {
      const queryFactory = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Relation not found' },
      });

      const result = await retryQuery(queryFactory, { maxRetries: 3, baseDelayMs: 10 });
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Relation not found');
      expect(queryFactory).toHaveBeenCalledTimes(1);
    });
  });
});
