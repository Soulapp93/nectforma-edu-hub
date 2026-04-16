import { supabase } from '@/integrations/supabase/client';

export interface SignatureRequest {
  id: string;
  formation_id: string;
  period_id: string | null;
  establishment_id: string;
  signer_name: string;
  signer_email: string;
  signer_role: string;
  token: string;
  status: 'pending' | 'signed' | 'expired';
  signature_image_url: string | null;
  signed_at: string | null;
  signed_ip: string | null;
  requested_by: string | null;
  created_at: string;
}

export const signatureService = {
  async getSignatureRequests(formationId: string): Promise<SignatureRequest[]> {
    const { data, error } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('formation_id', formationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as SignatureRequest[];
  },

  async createSignatureRequest(params: {
    formationId: string;
    periodId?: string;
    establishmentId: string;
    signerName: string;
    signerEmail: string;
    signerRole: string;
    requestedBy: string;
  }): Promise<SignatureRequest> {
    const { data, error } = await supabase
      .from('signature_requests')
      .insert({
        formation_id: params.formationId,
        period_id: params.periodId || null,
        establishment_id: params.establishmentId,
        signer_name: params.signerName,
        signer_email: params.signerEmail,
        signer_role: params.signerRole,
        requested_by: params.requestedBy,
      })
      .select()
      .single();
    if (error) throw error;
    return data as SignatureRequest;
  },

  async getByToken(token: string): Promise<SignatureRequest | null> {
    const { data, error } = await supabase
      .from('signature_requests')
      .select('*, formations(title), establishments(name)')
      .eq('token', token)
      .single();
    if (error) return null;
    return data as any;
  },

  async signRequest(token: string, signatureDataUrl: string): Promise<void> {
    // Upload signature image
    const blob = await (await fetch(signatureDataUrl)).blob();
    const fileName = `signatures/${token}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('establishment-docs')
      .upload(fileName, blob, { contentType: 'image/png' });

    let signatureUrl = signatureDataUrl; // fallback to data URL
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('establishment-docs').getPublicUrl(fileName);
      signatureUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from('signature_requests')
      .update({
        status: 'signed',
        signature_image_url: signatureUrl,
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('token', token)
      .eq('status', 'pending');
    if (error) throw error;
  },

  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase.from('signature_requests').delete().eq('id', id);
    if (error) throw error;
  },
};
