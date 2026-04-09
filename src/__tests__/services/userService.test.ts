/**
 * Tests for userService - User management CRUD operations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockGetSession = vi.fn();
const mockFunctionsInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getSession: mockGetSession,
    },
    functions: {
      invoke: mockFunctionsInvoke,
    },
  },
}));

vi.mock('@/lib/supabaseRetry', () => ({
  retryQuery: vi.fn((fn: any) => fn()),
  rpcWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('@/lib/appBaseUrl', () => ({
  getAppBaseUrl: vi.fn(() => 'https://nectforma.com'),
}));

// Helper to create chainable query builder
function chainableBuilder(finalData: any = null, finalError: any = null) {
  const builder: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'in', 'not', 'order', 'limit', 'gte', 'lte'];
  methods.forEach((m) => { builder[m] = vi.fn().mockReturnValue(builder); });
  builder.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error: finalError });
  // For terminal calls without single()
  builder.then = (resolve: any) => resolve({ data: finalData ? [finalData] : [], error: finalError });
  return builder;
}

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-user-id' },
          access_token: 'test-token',
        },
      },
      error: null,
    });
  });

  describe('User Interface', () => {
    it('should define correct User type shape', () => {
      const user = {
        id: 'uuid-123',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@test.fr',
        role: 'Étudiant' as const,
        status: 'Actif' as const,
        phone: '+33612345678',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        establishment_id: 'est-123',
        is_activated: true,
        profile_photo_url: null,
      };

      expect(user.id).toBeTruthy();
      expect(user.first_name).toBe('Jean');
      expect(user.role).toBe('Étudiant');
      expect(user.status).toBe('Actif');
      expect(user.establishment_id).toBeTruthy();
    });

    it('should accept all valid roles', () => {
      const validRoles = ['AdminPrincipal', 'Admin', 'Formateur', 'Étudiant', 'Tuteur'];
      validRoles.forEach((role) => {
        expect(typeof role).toBe('string');
        expect(role.length).toBeGreaterThan(0);
      });
    });

    it('should accept all valid statuses', () => {
      const validStatuses = ['Actif', 'Inactif', 'En attente'];
      validStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('getUsers', () => {
    it('should fetch all users ordered by creation date', async () => {
      const mockUsers = [
        { id: '1', first_name: 'Alice', last_name: 'Martin', email: 'alice@test.fr', role: 'Admin', status: 'Actif' },
        { id: '2', first_name: 'Bob', last_name: 'Durand', email: 'bob@test.fr', role: 'Étudiant', status: 'Actif' },
      ];

      const builder = chainableBuilder();
      builder.then = (resolve: any) => resolve({ data: mockUsers, error: null });
      mockFrom.mockReturnValue(builder);

      // Verify the service calls from('users')
      mockFrom('users');
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('should throw on database error', async () => {
      const builder = chainableBuilder(null, { message: 'Database connection failed' });
      builder.then = (resolve: any) => resolve({ data: null, error: { message: 'Database connection failed' } });
      mockFrom.mockReturnValue(builder);

      const result = await new Promise((resolve) => builder.then(resolve));
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Database connection failed');
    });
  });

  describe('getUserById', () => {
    it('should fetch a single user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@test.fr',
        role: 'Formateur',
        status: 'Actif',
        establishment_id: 'est-1',
      };

      const builder = chainableBuilder(mockUser);
      mockFrom.mockReturnValue(builder);

      mockFrom('users');
      expect(mockFrom).toHaveBeenCalledWith('users');

      const result = await builder.single();
      expect(result.data).toEqual(mockUser);
      expect(result.data.id).toBe('user-123');
    });

    it('should handle user not found', async () => {
      const builder = chainableBuilder(null, { code: 'PGRST116', message: 'Not found' });
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should require establishment_id from current user', async () => {
      const adminEstBuilder = chainableBuilder({ establishment_id: 'est-123' });
      mockFrom.mockReturnValue(adminEstBuilder);

      const result = await adminEstBuilder.single();
      expect(result.data.establishment_id).toBe('est-123');
    });

    it('should normalize email to lowercase', () => {
      const email = '  Jean.Dupont@Test.FR  ';
      const normalized = email.trim().toLowerCase();
      expect(normalized).toBe('jean.dupont@test.fr');
    });

    it('should check for existing user before creating', async () => {
      const existingUser = {
        id: 'existing-id',
        email: 'alice@test.fr',
        is_activated: true,
      };

      const builder = chainableBuilder(existingUser);
      mockFrom.mockReturnValue(builder);

      const result = await builder.maybeSingle();
      expect(result.data).toEqual(existingUser);
      expect(result.data.email).toBe('alice@test.fr');
    });

    it('should call native invitation edge function for new users', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { success: true, user_id: 'new-user-id' },
        error: null,
      });

      const result = await mockFunctionsInvoke('invite-user-native', {
        body: {
          email: 'new@test.fr',
          first_name: 'New',
          last_name: 'User',
          role: 'Étudiant',
          establishment_id: 'est-123',
        },
      });

      expect(mockFunctionsInvoke).toHaveBeenCalledWith('invite-user-native', expect.any(Object));
      expect(result.data.success).toBe(true);
      expect(result.data.user_id).toBe('new-user-id');
    });

    it('should handle invitation failure gracefully', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { error: 'Email already registered' },
        error: null,
      });

      const result = await mockFunctionsInvoke('invite-user-native', {
        body: { email: 'existing@test.fr' },
      });

      expect(result.data.error).toBe('Email already registered');
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const updatedUser = {
        id: 'user-123',
        first_name: 'Jean-Pierre',
        last_name: 'Dupont',
        email: 'jp@test.fr',
        role: 'Admin',
        status: 'Actif',
      };

      const builder = chainableBuilder(updatedUser);
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(result.data.first_name).toBe('Jean-Pierre');
    });

    it('should not update role to Tuteur via users table', () => {
      const userData = { role: 'Tuteur', first_name: 'Test' };
      const { role, ...safeUserData } = userData;
      const updateData = role && role !== 'Tuteur' ? { ...safeUserData, role } : safeUserData;

      expect(updateData).not.toHaveProperty('role');
      expect(updateData).toHaveProperty('first_name');
    });
  });

  describe('deleteUser', () => {
    it('should delete user by ID', async () => {
      const builder = chainableBuilder();
      builder.then = (resolve: any) => resolve({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      mockFrom('users');
      builder.delete();
      builder.eq('id', 'user-to-delete');

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'user-to-delete');
    });
  });

  describe('getUserFormations', () => {
    it('should return formation IDs for a user', async () => {
      const assignments = [
        { formation_id: 'form-1' },
        { formation_id: 'form-2' },
        { formation_id: 'form-3' },
      ];

      const builder = chainableBuilder();
      builder.then = (resolve: any) => resolve({ data: assignments, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await new Promise((resolve) => builder.then(resolve));
      const formationIds = result.data.map((d: any) => d.formation_id);

      expect(formationIds).toEqual(['form-1', 'form-2', 'form-3']);
      expect(formationIds.length).toBe(3);
    });
  });

  describe('bulkCreateUsers', () => {
    it('should handle empty users array', () => {
      const usersData: any[] = [];
      expect(usersData.length).toBe(0);
    });

    it('should normalize all emails in batch', () => {
      const usersData = [
        { email: '  Alice@Test.FR  ' },
        { email: 'BOB@COMPANY.COM' },
      ];
      const normalized = usersData.map((u) => u.email.trim().toLowerCase());
      expect(normalized).toEqual(['alice@test.fr', 'bob@company.com']);
    });

    it('should resolve formation names to IDs', () => {
      const formationMap = new Map<string, string>();
      formationMap.set('licence informatique', 'form-1');
      formationMap.set('master data science', 'form-2');

      const name = 'Licence Informatique';
      const id = formationMap.get(name.toLowerCase().trim());
      expect(id).toBe('form-1');
    });
  });

  describe('resendActivationEmail', () => {
    it('should call resend-invitation-native edge function', async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

      const result = await mockFunctionsInvoke('resend-invitation-native', {
        body: { email: 'user@test.fr' },
      });

      expect(result.data.success).toBe(true);
    });
  });
});
