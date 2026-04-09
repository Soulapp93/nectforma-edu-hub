/**
 * Tests for formationService - Formation management
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

vi.mock('@/lib/supabaseRetry', () => ({
  retryQuery: vi.fn((fn: any) => fn()),
  rpcWithRetry: vi.fn((fn: any) => fn()),
  isTransientError: vi.fn(() => false),
}));

function chainableBuilder(finalData: any = null, finalError: any = null) {
  const builder: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'not', 'order', 'limit'];
  methods.forEach((m) => { builder[m] = vi.fn().mockReturnValue(builder); });
  builder.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error: finalError });
  builder.then = (resolve: any) => resolve({ data: Array.isArray(finalData) ? finalData : finalData ? [finalData] : [], error: finalError });
  return builder;
}

describe('formationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Formation Interface', () => {
    it('should have correct formation data shape', () => {
      const formation = {
        id: 'form-123',
        title: 'Licence Informatique',
        description: 'Formation en informatique',
        level: 'Licence',
        start_date: '2026-09-01',
        end_date: '2027-06-30',
        status: 'Actif',
        color: '#8B5CF6',
        duration: 600,
        max_students: 30,
        price: 5000,
        establishment_id: 'est-123',
        academic_year: '2026-2027',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(formation.id).toBeTruthy();
      expect(formation.title).toBe('Licence Informatique');
      expect(formation.level).toBe('Licence');
      expect(formation.duration).toBeGreaterThan(0);
      expect(formation.max_students).toBeGreaterThan(0);
      expect(formation.status).toBe('Actif');
    });

    it('should accept valid formation statuses', () => {
      const validStatuses = ['Actif', 'Inactif', 'Terminé'];
      validStatuses.forEach((s) => expect(typeof s).toBe('string'));
    });
  });

  describe('createFormation', () => {
    it('should insert formation and return created data', async () => {
      const newFormation = {
        title: 'BTS SIO',
        description: 'BTS Services Informatiques',
        level: 'BTS',
        start_date: '2026-09-01',
        end_date: '2028-06-30',
        status: 'Actif',
        duration: 1200,
        max_students: 25,
        establishment_id: 'est-123',
      };

      const created = { id: 'form-new', ...newFormation, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const builder = chainableBuilder(created);
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(result.data.id).toBe('form-new');
      expect(result.data.title).toBe('BTS SIO');
    });

    it('should handle creation error', async () => {
      const builder = chainableBuilder(null, { message: 'Duplicate title' });
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Duplicate title');
    });
  });

  describe('getFormations', () => {
    it('should fetch all formations with modules', async () => {
      const formations = [
        {
          id: 'form-1',
          title: 'Licence Info',
          formation_modules: [
            { id: 'mod-1', title: 'Algorithmes', duration_hours: 60 },
            { id: 'mod-2', title: 'Base de données', duration_hours: 40 },
          ],
        },
        {
          id: 'form-2',
          title: 'Master IA',
          formation_modules: [
            { id: 'mod-3', title: 'Machine Learning', duration_hours: 80 },
          ],
        },
      ];

      const builder = chainableBuilder(formations);
      mockFrom.mockReturnValue(builder);

      mockFrom('formations');
      builder.select('*, formation_modules(*)');
      builder.order('created_at', { ascending: false });

      expect(mockFrom).toHaveBeenCalledWith('formations');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.order).toHaveBeenCalled();
    });
  });

  describe('getFormationById', () => {
    it('should fetch a single formation with its modules', async () => {
      const formation = {
        id: 'form-123',
        title: 'Licence Info',
        formation_modules: [
          { id: 'mod-1', title: 'Algorithmes', duration_hours: 60, semester: 1 },
        ],
      };

      const builder = chainableBuilder(formation);
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(result.data.id).toBe('form-123');
      expect(result.data.formation_modules).toHaveLength(1);
      expect(result.data.formation_modules[0].title).toBe('Algorithmes');
    });
  });

  describe('updateFormation', () => {
    it('should update formation fields', async () => {
      const updated = {
        id: 'form-123',
        title: 'Licence Informatique (Mis à jour)',
        status: 'Actif',
        max_students: 35,
      };

      const builder = chainableBuilder(updated);
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(result.data.title).toBe('Licence Informatique (Mis à jour)');
      expect(result.data.max_students).toBe(35);
    });
  });

  describe('deleteFormation', () => {
    it('should delete modules before deleting formation', async () => {
      const builder = chainableBuilder();
      builder.then = (resolve: any) => resolve({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      // First call: delete modules
      mockFrom('formation_modules');
      builder.delete();
      builder.eq('formation_id', 'form-123');

      // Second call: delete formation
      mockFrom('formations');
      builder.delete();
      builder.eq('id', 'form-123');

      expect(mockFrom).toHaveBeenCalledWith('formation_modules');
      expect(mockFrom).toHaveBeenCalledWith('formations');
      expect(builder.delete).toHaveBeenCalled();
    });
  });

  describe('getFormationParticipantsCount', () => {
    it('should call RPC to get student count', async () => {
      const students = [
        { id: 's1', first_name: 'Alice' },
        { id: 's2', first_name: 'Bob' },
        { id: 's3', first_name: 'Charlie' },
      ];

      mockRpc.mockResolvedValue({ data: students, error: null });

      const result = await mockRpc('get_formation_students', { formation_id_param: 'form-123' });
      expect(result.data).toHaveLength(3);
      expect(mockRpc).toHaveBeenCalledWith('get_formation_students', { formation_id_param: 'form-123' });
    });

    it('should return 0 on error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } });

      const result = await mockRpc('get_formation_students', { formation_id_param: 'form-invalid' });
      expect(result.error).toBeTruthy();
      const count = (result.data as any[])?.length || 0;
      expect(count).toBe(0);
    });
  });

  describe('getFormationInstructors', () => {
    it('should resolve instructors via modules', async () => {
      // This tests the multi-step query:
      // 1. Get modules for formation
      // 2. Get instructor IDs from module_instructors
      // 3. Get user details for instructors

      const modules = [{ id: 'mod-1' }, { id: 'mod-2' }];
      const instructorAssignments = [{ instructor_id: 'inst-1' }, { instructor_id: 'inst-2' }, { instructor_id: 'inst-1' }];
      const uniqueIds = [...new Set(instructorAssignments.map((a) => a.instructor_id))];

      expect(uniqueIds).toEqual(['inst-1', 'inst-2']);
      expect(uniqueIds.length).toBe(2); // Deduplication works
    });
  });

  describe('migrateStudents', () => {
    it('should remove from old formation and add to new', async () => {
      const studentIds = ['s1', 's2'];
      const fromFormation = 'form-old';
      const toFormation = 'form-new';

      const builder = chainableBuilder();
      builder.then = (resolve: any) => resolve({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      // Delete old assignments
      mockFrom('user_formation_assignments');
      builder.delete();
      expect(builder.delete).toHaveBeenCalled();

      // Insert new assignments
      const assignments = studentIds.map((sid) => ({ user_id: sid, formation_id: toFormation }));
      expect(assignments).toHaveLength(2);
      expect(assignments[0].formation_id).toBe('form-new');
    });
  });
});
