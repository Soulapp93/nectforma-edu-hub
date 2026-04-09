/**
 * Supabase client mock for unit testing.
 * Provides chainable query builder and common method stubs.
 */
import { vi } from 'vitest';

// Chainable query builder mock
function createQueryBuilder(resolvedData: any = null, resolvedError: any = null) {
  const builder: any = {
    _data: resolvedData,
    _error: resolvedError,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    then: vi.fn((resolve: any) => resolve({ data: resolvedData, error: resolvedError })),
  };

  // Make the builder itself thenable (for await)
  builder[Symbol.for('nodejs.util.promisify.custom')] = () =>
    Promise.resolve({ data: resolvedData, error: resolvedError });

  return builder;
}

// Create a fresh mock supabase client
export function createMockSupabase() {
  const mockQueryBuilder = createQueryBuilder();

  const supabase = {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            access_token: 'test-token',
          },
        },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' }, user: { id: 'test-user-id' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.png' } }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
    _queryBuilder: mockQueryBuilder,
  };

  return supabase;
}

// Helper to configure query builder response for a specific chain
export function mockQueryResponse(
  supabase: any,
  tableName: string,
  data: any,
  error: any = null
) {
  const builder = createQueryBuilder(data, error);
  supabase.from.mockImplementation((table: string) => {
    if (table === tableName) return builder;
    return createQueryBuilder();
  });
  return builder;
}

// Helper to mock RPC response
export function mockRpcResponse(supabase: any, fnName: string, data: any, error: any = null) {
  supabase.rpc.mockImplementation((name: string, ...args: any[]) => {
    if (name === fnName) return Promise.resolve({ data, error });
    return Promise.resolve({ data: null, error: null });
  });
}
