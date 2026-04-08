import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTransientError, withRetry, rpcWithRetry, retryQuery } from '@/lib/supabaseRetry';

describe('supabaseRetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── isTransientError ──────────────────────────────────────────────

  describe('isTransientError', () => {
    it('returns false for null/undefined', () => {
      expect(isTransientError(null)).toBe(false);
      expect(isTransientError(undefined)).toBe(false);
    });

    it('detects "Failed to fetch"', () => {
      expect(isTransientError(new Error('Failed to fetch'))).toBe(true);
    });

    it('detects "Load failed"', () => {
      expect(isTransientError(new Error('Load failed'))).toBe(true);
    });

    it('detects "timeout"', () => {
      expect(isTransientError(new Error('Request timeout after 5000ms'))).toBe(true);
    });

    it('detects network error patterns', () => {
      const patterns = [
        'NetworkError when attempting to fetch resource',
        'net::ERR_CONNECTION_RESET',
        'ECONNRESET',
        'ETIMEDOUT',
        'socket hang up',
        'Connection refused',
      ];
      patterns.forEach(msg => {
        expect(isTransientError(new Error(msg))).toBe(true);
      });
    });

    it('returns false for non-transient errors', () => {
      expect(isTransientError(new Error('Permission denied'))).toBe(false);
      expect(isTransientError(new Error('Invalid JWT'))).toBe(false);
      expect(isTransientError(new Error('Row not found'))).toBe(false);
    });

    it('handles plain string errors', () => {
      expect(isTransientError('Failed to fetch')).toBe(true);
      expect(isTransientError('some other error')).toBe(false);
    });

    it('handles error-like objects with message property', () => {
      expect(isTransientError({ message: 'Load failed' })).toBe(true);
      expect(isTransientError({ message: 'access denied' })).toBe(false);
    });
  });

  // ── withRetry ─────────────────────────────────────────────────────

  describe('withRetry', () => {
    it('returns result on first success', async () => {
      const op = vi.fn().mockResolvedValue('ok');
      const result = await withRetry(op);
      expect(result).toBe('ok');
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('retries on transient error then succeeds', async () => {
      const op = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('ok');

      const result = await withRetry(op, { maxRetries: 2, baseDelayMs: 1 });
      expect(result).toBe('ok');
      expect(op).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on non-transient error', async () => {
      const op = vi.fn().mockRejectedValue(new Error('Permission denied'));
      await expect(withRetry(op, { maxRetries: 3, baseDelayMs: 1 })).rejects.toThrow('Permission denied');
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting retries', async () => {
      const op = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
      await expect(withRetry(op, { maxRetries: 2, baseDelayMs: 1 })).rejects.toThrow('Failed to fetch');
      expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('calls onRetry callback on each retry', async () => {
      const onRetry = vi.fn();
      const op = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValue('ok');

      await withRetry(op, { maxRetries: 3, baseDelayMs: 1, onRetry });
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
    });

    it('retries when Supabase result contains transient error', async () => {
      const op = vi.fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Load failed' } })
        .mockResolvedValue({ data: 'success', error: null });

      const result = await withRetry(op, { maxRetries: 2, baseDelayMs: 1 });
      expect(result).toEqual({ data: 'success', error: null });
      expect(op).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry when Supabase result has non-transient error', async () => {
      const result = { data: null, error: { message: 'Invalid token' } };
      const op = vi.fn().mockResolvedValue(result);
      // Non-transient error in result is just returned as-is (no throw)
      const r = await withRetry(op, { maxRetries: 2, baseDelayMs: 1 });
      expect(r).toEqual(result);
      expect(op).toHaveBeenCalledTimes(1);
    });
  });

  // ── rpcWithRetry ──────────────────────────────────────────────────

  describe('rpcWithRetry', () => {
    it('returns data on success', async () => {
      const rpc = vi.fn().mockResolvedValue({ data: 'Admin', error: null });
      const result = await rpcWithRetry(rpc, { baseDelayMs: 1 });
      expect(result).toEqual({ data: 'Admin', error: null });
    });

    it('retries on transient error then succeeds', async () => {
      const rpc = vi.fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch' } })
        .mockResolvedValue({ data: 'Admin', error: null });

      const result = await rpcWithRetry(rpc, { maxRetries: 2, baseDelayMs: 1 });
      expect(result).toEqual({ data: 'Admin', error: null });
      expect(rpc).toHaveBeenCalledTimes(2);
    });

    it('returns error after exhausting retries', async () => {
      const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
      const result = await rpcWithRetry(rpc, { maxRetries: 1, baseDelayMs: 1 });
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Failed to fetch');
    });

    it('returns non-transient error immediately', async () => {
      const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC not found' } });
      const result = await rpcWithRetry(rpc, { maxRetries: 3, baseDelayMs: 1 });
      expect(result.error?.message).toBe('RPC not found');
      expect(rpc).toHaveBeenCalledTimes(1);
    });

    it('handles thrown exceptions gracefully', async () => {
      const rpc = vi.fn().mockRejectedValue(new Error('Network failure timeout'));
      const result = await rpcWithRetry(rpc, { maxRetries: 1, baseDelayMs: 1 });
      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('timeout');
    });
  });

  // ── retryQuery ────────────────────────────────────────────────────

  describe('retryQuery', () => {
    it('returns data on success', async () => {
      const query = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
      const result = await retryQuery(query, { baseDelayMs: 1 });
      expect(result.data).toEqual([{ id: '1' }]);
      expect(result.error).toBeNull();
    });

    it('retries on transient error then succeeds', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'ECONNRESET' } })
        .mockResolvedValue({ data: [{ id: '1' }], error: null });

      const result = await retryQuery(query, { maxRetries: 2, baseDelayMs: 1 });
      expect(result.data).toEqual([{ id: '1' }]);
      expect(query).toHaveBeenCalledTimes(2);
    });

    it('returns error after exhausting retries', async () => {
      const query = vi.fn().mockResolvedValue({ data: null, error: { message: 'socket hang up' } });
      const result = await retryQuery(query, { maxRetries: 1, baseDelayMs: 1 });
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('socket hang up');
    });

    it('returns non-transient error immediately without retry', async () => {
      const query = vi.fn().mockResolvedValue({ data: null, error: { message: 'relation "x" does not exist' } });
      const result = await retryQuery(query, { maxRetries: 3, baseDelayMs: 1 });
      expect(result.error?.message).toContain('does not exist');
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
