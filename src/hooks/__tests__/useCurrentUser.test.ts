import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';

// Mock useAuth
const mockAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

// Mock supabase (needed by useCurrentUser module)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Import after mocks
import { useCurrentUser } from '@/hooks/useCurrentUser';

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state while auth is loading', () => {
    mockAuth.mockReturnValue({
      userId: null,
      userRole: null,
      isSuperAdmin: false,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.loading).toBe(true);
    expect(result.current.userId).toBeNull();
    expect(result.current.userRole).toBeNull();
  });

  it('returns user data when authenticated', () => {
    mockAuth.mockReturnValue({
      userId: 'user-123',
      userRole: 'Admin',
      isSuperAdmin: false,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.userId).toBe('user-123');
    expect(result.current.userRole).toBe('Admin');
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('returns SuperAdmin state correctly', () => {
    mockAuth.mockReturnValue({
      userId: 'admin-1',
      userRole: 'SuperAdmin',
      isSuperAdmin: true,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.userRole).toBe('SuperAdmin');
  });

  it('returns error state', () => {
    mockAuth.mockReturnValue({
      userId: null,
      userRole: null,
      isSuperAdmin: false,
      loading: false,
      error: 'Session expired',
    });

    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.error).toBe('Session expired');
    expect(result.current.userId).toBeNull();
  });

  it('returns null values when not authenticated', () => {
    mockAuth.mockReturnValue({
      userId: null,
      userRole: null,
      isSuperAdmin: false,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.userId).toBeNull();
    expect(result.current.userRole).toBeNull();
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
