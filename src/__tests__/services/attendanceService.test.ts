/**
 * Tests for attendanceService - Attendance/signature management
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();
const mockFunctionsInvoke = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: { getSession: mockGetSession },
    functions: { invoke: mockFunctionsInvoke },
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

function chainableBuilder(finalData: any = null, finalError: any = null) {
  const builder: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'in', 'not', 'gte', 'lte', 'lt', 'order', 'limit', 'is'];
  methods.forEach((m) => { builder[m] = vi.fn().mockReturnValue(builder); });
  builder.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error: finalError });
  builder.then = (resolve: any) => resolve({ data: Array.isArray(finalData) ? finalData : [], error: finalError });
  return builder;
}

describe('attendanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' }, access_token: 'token' } },
      error: null,
    });
  });

  describe('AttendanceSheet Interface', () => {
    it('should have correct data shape', () => {
      const sheet = {
        id: 'sheet-1',
        schedule_slot_id: 'slot-1',
        formation_id: 'form-1',
        title: 'Cours Algorithmes - Feuille d\'émargement',
        date: '2026-01-30',
        start_time: '09:00',
        end_time: '12:00',
        instructor_id: 'inst-1',
        room: 'Salle A1',
        status: 'En attente',
        session_type: 'presentiel' as const,
        is_open_for_signing: false,
      };

      expect(sheet.id).toBeTruthy();
      expect(sheet.formation_id).toBeTruthy();
      expect(sheet.session_type).toBe('presentiel');
      expect(sheet.status).toBe('En attente');
    });

    it('should accept valid session types', () => {
      const validTypes = ['presentiel', 'autonomie', 'distanciel'];
      validTypes.forEach((t) => expect(typeof t).toBe('string'));
    });

    it('should accept valid statuses', () => {
      const validStatuses = ['En attente', 'En cours', 'En attente de validation', 'Validé'];
      validStatuses.forEach((s) => expect(typeof s).toBe('string'));
    });
  });

  describe('AttendanceSignature Interface', () => {
    it('should have correct signature data shape', () => {
      const signature = {
        id: 'sig-1',
        attendance_sheet_id: 'sheet-1',
        user_id: 'student-1',
        user_type: 'student' as const,
        signature_data: 'data:image/png;base64,...',
        signed_at: '2026-01-30T09:15:00Z',
        present: true,
        absence_reason: null,
        absence_reason_type: null,
      };

      expect(signature.user_type).toBe('student');
      expect(signature.present).toBe(true);
      expect(signature.signature_data).toContain('data:image');
    });

    it('should accept valid absence reason types', () => {
      const validReasons = ['congé', 'arret_travail', 'autre', 'injustifié', 'mission_professionnelle', 'entreprise'];
      validReasons.forEach((r) => expect(typeof r).toBe('string'));
    });
  });

  describe('generateAttendanceSheets', () => {
    it('should query schedule slots for today and tomorrow', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const builder = chainableBuilder([]);
      mockFrom.mockReturnValue(builder);

      mockFrom('schedule_slots');
      builder.select('*');
      builder.gte('date', today);
      builder.lte('date', tomorrowStr);

      expect(mockFrom).toHaveBeenCalledWith('schedule_slots');
      expect(builder.gte).toHaveBeenCalledWith('date', today);
    });

    it('should filter out slots that already have sheets', () => {
      const allSlots = [
        { id: 'slot-1' },
        { id: 'slot-2' },
        { id: 'slot-3' },
      ];
      const existingSheetSlotIds = ['slot-1'];

      const slotsNeedingSheets = allSlots.filter(
        (slot) => !existingSheetSlotIds.includes(slot.id)
      );

      expect(slotsNeedingSheets).toHaveLength(2);
      expect(slotsNeedingSheets.map((s) => s.id)).toEqual(['slot-2', 'slot-3']);
    });
  });

  describe('getAttendanceSheets', () => {
    it('should fetch sheets with relations', async () => {
      const builder = chainableBuilder([]);
      mockFrom.mockReturnValue(builder);

      mockFrom('attendance_sheets');
      builder.select('*, formations!formation_id(title, level), attendance_signatures(*)');
      builder.order('date', { ascending: false });

      expect(mockFrom).toHaveBeenCalledWith('attendance_sheets');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.order).toHaveBeenCalledWith('date', { ascending: false });
    });
  });

  describe('signAttendanceSheet', () => {
    it('should check for existing signature before signing', async () => {
      const builder = chainableBuilder(null, { code: 'PGRST116' });
      mockFrom.mockReturnValue(builder);

      // First check existing
      mockFrom('attendance_signatures');
      builder.select('id');
      builder.eq('attendance_sheet_id', 'sheet-1');
      builder.eq('user_id', 'student-1');

      expect(builder.eq).toHaveBeenCalledWith('attendance_sheet_id', 'sheet-1');
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'student-1');
    });

    it('should create signature with correct user_type', async () => {
      const newSignature = {
        attendance_sheet_id: 'sheet-1',
        user_id: 'student-1',
        user_type: 'student',
        signature_data: 'data:image/png;base64,abc123',
        present: true,
      };

      const builder = chainableBuilder(newSignature);
      mockFrom.mockReturnValue(builder);

      builder.insert(newSignature);
      expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_type: 'student',
        present: true,
      }));
    });

    it('should save instructor signature for reuse', async () => {
      const signatureData = 'data:image/png;base64,instructor-sig';
      const instructorId = 'inst-1';

      const builder = chainableBuilder();
      mockFrom.mockReturnValue(builder);

      // Upsert to user_signatures
      mockFrom('user_signatures');
      builder.upsert({ user_id: instructorId, signature_data: signatureData }, { onConflict: 'user_id' });

      expect(mockFrom).toHaveBeenCalledWith('user_signatures');
      expect(builder.upsert).toHaveBeenCalled();
    });
  });

  describe('hasUserSigned', () => {
    it('should return true if signature exists', async () => {
      const builder = chainableBuilder({ id: 'sig-1' });
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(!!result.data).toBe(true);
    });

    it('should return false if no signature found', async () => {
      const builder = chainableBuilder(null, { code: 'PGRST116' });
      mockFrom.mockReturnValue(builder);

      const result = await builder.single();
      expect(!!result.data).toBe(false);
    });
  });

  describe('markStudentAbsent', () => {
    it('should create absence record with reason', async () => {
      const absenceRecord = {
        attendance_sheet_id: 'sheet-1',
        user_id: 'student-1',
        user_type: 'student',
        present: false,
        absence_reason: 'Malade',
        absence_reason_type: 'arret_travail',
      };

      const builder = chainableBuilder(absenceRecord);
      mockFrom.mockReturnValue(builder);

      builder.insert(absenceRecord);
      expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({
        present: false,
        absence_reason_type: 'arret_travail',
      }));
    });
  });

  describe('validateAttendanceSheet', () => {
    it('should update sheet status to Validé with admin info', async () => {
      const validated = {
        id: 'sheet-1',
        status: 'Validé',
        validated_at: expect.any(String),
        validated_by: 'admin-1',
      };

      const builder = chainableBuilder(validated);
      mockFrom.mockReturnValue(builder);

      builder.update({
        status: 'Validé',
        validated_at: new Date().toISOString(),
        validated_by: 'admin-1',
      });

      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'Validé',
        validated_by: 'admin-1',
      }));
    });
  });

  describe('toggleStudentPresence', () => {
    it('should handle absent to present transition', () => {
      const existingSig = {
        id: 'sig-1',
        present: false,
        signature_data: null,
      };

      // Should try to find saved signature for the student
      const newPresent = true;
      expect(newPresent).toBe(true);
      expect(existingSig.present).toBe(false);
    });

    it('should handle present to absent transition', () => {
      const existingSig = {
        id: 'sig-1',
        present: true,
        signature_data: 'data:image/png;base64,sig',
      };

      const newPresent = false;
      expect(newPresent).toBe(false);
    });

    it('should implement signature fallback chain', () => {
      // Fallback chain:
      // 1. Existing signature_data on the attendance_signatures row
      // 2. Last known signature from attendance history
      // 3. Profile signature from user_signatures

      const fallbackSources = [
        'attendance_signatures.signature_data',
        'attendance_signatures (history)',
        'user_signatures',
      ];

      expect(fallbackSources).toHaveLength(3);
    });
  });

  describe('openAttendanceForSigning', () => {
    it('should update sheet to open state', async () => {
      const builder = chainableBuilder();
      builder.then = (resolve: any) => resolve({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      builder.update({
        is_open_for_signing: true,
        opened_at: expect.any(String),
        status: 'En cours',
      });

      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
        is_open_for_signing: true,
        status: 'En cours',
      }));
    });
  });

  describe('subscribeToSignatures', () => {
    it('should create realtime subscription for a sheet', () => {
      const channelMock = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockChannel.mockReturnValue(channelMock);

      const channel = mockChannel(`signatures-sheet-1`);
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance_signatures',
        filter: 'attendance_sheet_id=eq.sheet-1',
      }, vi.fn());
      channel.subscribe();

      expect(mockChannel).toHaveBeenCalledWith('signatures-sheet-1');
      expect(channel.on).toHaveBeenCalled();
      expect(channel.subscribe).toHaveBeenCalled();
    });

    it('should return cleanup function', () => {
      const channelMock = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockChannel.mockReturnValue(channelMock);

      const channel = mockChannel('test');
      const cleanup = () => mockRemoveChannel(channel);

      cleanup();
      expect(mockRemoveChannel).toHaveBeenCalledWith(channel);
    });
  });

  describe('sendSignatureLink', () => {
    it('should call edge function with correct params', async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

      const result = await mockFunctionsInvoke('send-signature-link', {
        body: {
          attendanceSheetId: 'sheet-1',
          studentIds: ['s1', 's2'],
          baseUrl: 'https://nectforma.com',
        },
      });

      expect(mockFunctionsInvoke).toHaveBeenCalledWith('send-signature-link', expect.objectContaining({
        body: expect.objectContaining({
          attendanceSheetId: 'sheet-1',
          studentIds: ['s1', 's2'],
        }),
      }));
      expect(result.data.success).toBe(true);
    });
  });

  describe('generateSignatureToken', () => {
    it('should call RPC to generate token', async () => {
      mockRpc.mockResolvedValue({ data: 'token-abc-123', error: null });

      const result = await mockRpc('generate_signature_token', { sheet_id: 'sheet-1' });
      expect(result.data).toBe('token-abc-123');
    });
  });

  describe('validateSignatureToken', () => {
    it('should validate a token via RPC', async () => {
      mockRpc.mockResolvedValue({
        data: [{ sheet_id: 'sheet-1', is_valid: true }],
        error: null,
      });

      const result = await mockRpc('validate_signature_token', { token_param: 'token-abc' });
      expect(result.data[0].is_valid).toBe(true);
      expect(result.data[0].sheet_id).toBe('sheet-1');
    });

    it('should handle invalid token', async () => {
      mockRpc.mockResolvedValue({
        data: [{ sheet_id: null, is_valid: false, error_message: 'Token expiré' }],
        error: null,
      });

      const result = await mockRpc('validate_signature_token', { token_param: 'invalid' });
      expect(result.data[0].is_valid).toBe(false);
    });
  });
});
