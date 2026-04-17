import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { CreditCard, CheckCircle, XCircle, Wallet, Smartphone, Users, Download } from 'lucide-react';
import { studentCardService } from '@/services/studentCardService';

const StudentCardView: React.FC = () => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['my-student-cards', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_cards')
        .select('*, formations(title, level, academic_year)')
        .eq('student_id', userId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!userId,
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile-card', userId],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('first_name, last_name, email, profile_photo_url, date_of_birth').eq('id', userId!).single();
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><CreditCard className="h-8 w-8 animate-pulse text-muted-foreground" /></div>;
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-sm mb-1">Aucune carte etudiant</h3>
          <p className="text-xs text-muted-foreground text-center">Votre carte etudiant sera disponible ici une fois generee par l'administration.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="student-card-view">
      {cards.map((card: any) => {
        const isActive = card.status === 'active' && new Date(card.valid_until) >= new Date();
        return (
          <div key={card.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {card.formations?.title || 'Carte etudiant'}
                <Badge className={isActive ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-red-100 text-red-700 text-[10px]'}>
                  {isActive ? 'Active' : 'Expiree'}
                </Badge>
              </h3>
            </div>

            {/* Card Recto */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div>
                <p className="text-[10px] text-muted-foreground text-center mb-1 font-semibold">RECTO</p>
                <div className="rounded-xl overflow-hidden shadow-lg border mx-auto" style={{ width: 320, backgroundColor: '#fff' }}>
                  <div style={{ backgroundColor: '#1e3a5f', height: 55, display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>{establishment?.name}</span>
                  </div>
                  <div style={{ padding: '10px 15px' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', letterSpacing: 2, marginBottom: 8 }}>CARTE ETUDIANT</p>
                    <p style={{ fontSize: 11, color: '#1e3a5f', fontWeight: 600, marginBottom: 8 }}>{card.formations?.academic_year}</p>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ width: 100, height: 125, borderRadius: 8, border: '2px solid #cbd5e1', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                        {profile?.profile_photo_url ? (
                          <img src={profile.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, fontSize: 11 }}>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>Nom</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>{profile?.last_name}</p>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>Prenom</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>{profile?.first_name}</p>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>Formation</p>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#334155', marginBottom: 4 }}>{card.formations?.title}</p>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>N etudiant</p>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#1e3a5f' }}>{card.student_number}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#1e3a5f', padding: '6px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: '#93c5fd' }}>Valide {format(new Date(card.valid_from), 'dd/MM/yy')} - {format(new Date(card.valid_until), 'dd/MM/yy')}</span>
                    <Badge className="bg-white/20 text-white text-[8px]">{card.formations?.level}</Badge>
                  </div>
                </div>
              </div>

              {/* Card Verso */}
              <div>
                <p className="text-[10px] text-muted-foreground text-center mb-1 font-semibold">VERSO</p>
                <div className="rounded-xl overflow-hidden shadow-lg border mx-auto" style={{ width: 320, backgroundColor: '#fff' }}>
                  <div style={{ backgroundColor: '#1e3a5f', height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>CARTE D'ETUDIANT</span>
                  </div>
                  <div style={{ padding: 16, textAlign: 'center' }}>
                    <QRCode value={`${window.location.origin}/verify-card/${card.verification_code}`} size={120} style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>Scannez pour verifier cette carte</p>
                    <p style={{ fontSize: 9, fontWeight: 600, color: '#1e3a5f' }}>{card.student_number}</p>
                  </div>
                  <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
                      Cette carte est strictement personnelle et incessible. En cas de perte, prevenir immediatement l'etablissement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={() => {
                const url = studentCardService.generateGoogleWalletUrl(card, profile, card.formations, establishment);
                window.open(url, '_blank');
              }} data-testid="student-google-wallet">
                <Wallet className="h-4 w-4" /> Ajouter a Google Wallet
              </Button>
              <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={() => toast.info('Apple Wallet necessite une configuration serveur.')} data-testid="student-apple-wallet">
                <Smartphone className="h-4 w-4" /> Ajouter a Apple Wallet
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudentCardView;
