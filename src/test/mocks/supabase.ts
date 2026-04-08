/**
 * Reusable mock factory for the Supabase client.
 * Usage:
 *   vi.mock('@/integrations/supabase/client', () => ({ supabase: createMockSupabaseClient() }));
 */
import { vi } from 'vitest';

export function createMockSupabaseClient() {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(),
    // Allow chaining to resolve with default
    mockResolvedValue(value: any) {
      this.then = vi.fn((resolve: any) => resolve(value));
      return this;
    },
  };

  // Make the mock builder thenable (Promise-like) by default
  const makeThenable = (builder: any, defaultResult = { data: null, error: null }) => {
    const originalThen = builder.then;
    if (!originalThen._mockImplementation) {
      builder.then = vi.fn((resolve: any, reject?: any) => {
        return Promise.resolve(defaultResult).then(resolve, reject);
      });
    }
    return builder;
  };

  const client = {
    from: vi.fn((_table: string) => {
      const builder = { ...mockQueryBuilder };
      // Reset chaining
      Object.keys(builder).forEach(key => {
        if (typeof builder[key] === 'function' && key !== 'then' && key !== 'single' && key !== 'maybeSingle') {
          builder[key] = vi.fn().mockReturnValue(builder);
        }
      });
      builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
      builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      return makeThenable(builder);
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.png' } }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue('subscribed'),
    }),
    removeChannel: vi.fn(),
  };

  return client;
}

/**
 * Helper to create a mock Supabase query result
 */
export function mockQueryResult<T>(data: T, error: { message: string } | null = null) {
  return { data, error };
}

/**
 * Helper to create a mock Supabase error result
 */
export function mockQueryError(message: string) {
  return { data: null, error: { message } };
}
