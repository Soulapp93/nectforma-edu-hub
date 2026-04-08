import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factory is hoisted — use vi.hoisted for shared mock state
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  };
  return { mockClient };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockClient,
}));

// Import after mock is set up
import { formationService } from '@/services/formationService';

describe('formationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFormation', () => {
    it('creates a formation and returns data', async () => {
      const mockFormation = {
        id: 'f1',
        title: 'Formation Test',
        level: 'Bac+3',
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFormation, error: null }),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      const result = await formationService.createFormation({
        title: 'Formation Test',
        level: 'Bac+3',
        start_date: '2024-09-01',
        end_date: '2025-06-30',
        status: 'Actif',
        duration: 600,
        max_students: 25,
        establishment_id: 'est1',
      } as any);

      expect(result).toEqual(mockFormation);
      expect(mockClient.from).toHaveBeenCalledWith('formations');
    });

    it('throws on Supabase error', async () => {
      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Duplicate title' } }),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      await expect(formationService.createFormation({
        title: 'Dup',
        level: 'Bac+2',
        start_date: '2024-09-01',
        end_date: '2025-06-30',
        status: 'Actif',
        duration: 300,
        max_students: 20,
        establishment_id: 'est1',
      } as any)).rejects.toThrow('Duplicate title');
    });
  });

  describe('updateFormation', () => {
    it('updates and returns the formation', async () => {
      const updated = { id: 'f1', title: 'Updated Title' };
      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      const result = await formationService.updateFormation('f1', { title: 'Updated Title' });
      expect(result).toEqual(updated);
    });

    it('throws on error', async () => {
      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      await expect(formationService.updateFormation('f1', { title: 'X' })).rejects.toThrow('Not found');
    });
  });

  describe('getFormationParticipantsCount', () => {
    it('returns count of students', async () => {
      mockClient.rpc.mockResolvedValue({
        data: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
        error: null,
      });

      const count = await formationService.getFormationParticipantsCount('f1');
      expect(count).toBe(3);
    });

    it('returns 0 on error', async () => {
      mockClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      const count = await formationService.getFormationParticipantsCount('f1');
      expect(count).toBe(0);
    });

    it('returns 0 when data is null', async () => {
      mockClient.rpc.mockResolvedValue({ data: null, error: null });
      const count = await formationService.getFormationParticipantsCount('f1');
      expect(count).toBe(0);
    });
  });

  describe('getFormationStudents', () => {
    it('returns student list', async () => {
      const students = [{ id: 's1', first_name: 'Jean' }];
      mockClient.rpc.mockResolvedValue({ data: students, error: null });

      const result = await formationService.getFormationStudents('f1');
      expect(result).toEqual(students);
      expect(mockClient.rpc).toHaveBeenCalledWith('get_formation_students', {
        formation_id_param: 'f1',
      });
    });

    it('returns empty array on error', async () => {
      mockClient.rpc.mockResolvedValue({ data: null, error: { message: 'fail' } });
      const result = await formationService.getFormationStudents('f1');
      expect(result).toEqual([]);
    });
  });
});
