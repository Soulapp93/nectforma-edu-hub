import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { CreditCard, Users } from 'lucide-react';

// All user-facing labels are extracted as constants to avoid embedding
// French apostrophes/quotes directly in JSX text — this prevents an
// esbuild dependency scanner edge case that mis-parses certain
// punctuation sequences ("Unterminated regular expression" false positive).
const L = {
  cardLabel: 'CARTE ETUDIANT',
  cardLabelVerso: 'CARTE D ETUDIANT',
  loading: 'Chargement...',
  empty: 'Aucune carte disponible',
  active: 'Active',
  expired: 'Expiree',
  defaultTitle: 'Carte etudiant',
  fieldName: 'Nom',
  fieldFirstName: 'Prenom',
  fieldFormation: 'Formation',
  fieldStudentNumber: 'N etudiant',
  qrHint: 'Scannez pour verifier cette carte',
  legalNotice:
    'Cette carte est strictement personnelle et incessible. En cas de perte, prevenir immediatement le secretariat.',
  validityPrefix: 'Valide ',
} as const;

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
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name, email, profile_photo_url, date_of_birth')
        .eq('id', userId!)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CreditCard className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{L.empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {cards.map((card: any) => {
        const isActive =
          card.status === 'active' && new Date(card.valid_until) >= new Date();
        const validityRange =
          format(new Date(card.valid_from), 'dd/MM/yy') +
          ' - ' +
          format(new Date(card.valid_until), 'dd/MM/yy');
        const cardTitle = card.formations?.title || L.defaultTitle;

        return (
          <div key={card.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {cardTitle}
                <Badge
                  className={
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 text-[10px]'
                      : 'bg-red-100 text-red-700 text-[10px]'
                  }
                >
                  {isActive ? L.active : L.expired}
                </Badge>
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* RECTO */}
              <div>
                <p className="text-[10px] text-muted-foreground text-center mb-1 font-semibold">
                  RECTO
                </p>
                <div
                  className="rounded-xl overflow-hidden shadow-lg border mx-auto"
                  style={{ width: 320, backgroundColor: '#fff' }}
                >
                  <div
                    style={{
                      backgroundColor: '#1e3a5f',
                      height: 55,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 15px',
                    }}
                  >
                    <span
                      style={{
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {establishment?.name}
                    </span>
                  </div>

                  <div style={{ padding: '10px 15px' }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#1e3a5f',
                        letterSpacing: 2,
                        marginBottom: 8,
                      }}
                    >
                      {L.cardLabel}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: '#1e3a5f',
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      {card.formations?.academic_year}
                    </p>

                    <div style={{ display: 'flex', gap: 14 }}>
                      <div
                        style={{
                          width: 100,
                          height: 125,
                          borderRadius: 8,
                          border: '2px solid #cbd5e1',
                          backgroundColor: '#f1f5f9',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {profile?.profile_photo_url ? (
                          <img
                            src={profile.profile_photo_url}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Users className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, fontSize: 11 }}>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>
                          {L.fieldName}
                        </p>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#1e3a5f',
                            marginBottom: 4,
                          }}
                        >
                          {profile?.last_name}
                        </p>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>
                          {L.fieldFirstName}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#334155',
                            marginBottom: 4,
                          }}
                        >
                          {profile?.first_name}
                        </p>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>
                          {L.fieldFormation}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#334155',
                            marginBottom: 4,
                          }}
                        >
                          {card.formations?.title}
                        </p>
                        <p style={{ fontSize: 8, color: '#94a3b8' }}>
                          {L.fieldStudentNumber}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#1e3a5f',
                          }}
                        >
                          {card.student_number}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#1e3a5f',
                      padding: '6px 15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 9, color: '#93c5fd' }}>
                      {L.validityPrefix}{validityRange}
                    </span>
                    <Badge className="bg-white/20 text-white text-[8px]">
                      {card.formations?.level}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* VERSO */}
              <div>
                <p className="text-[10px] text-muted-foreground text-center mb-1 font-semibold">
                  VERSO
                </p>
                <div
                  className="rounded-xl overflow-hidden shadow-lg border mx-auto"
                  style={{ width: 320, backgroundColor: '#fff' }}
                >
                  <div
                    style={{
                      backgroundColor: '#1e3a5f',
                      height: 45,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      {L.cardLabelVerso}
                    </span>
                  </div>

                  <div style={{ padding: 16, textAlign: 'center' }}>
                    <QRCode
                      value={
                        window.location.origin +
                        '/verify-card/' +
                        card.verification_code
                      }
                      size={120}
                      style={{ margin: '0 auto 10px' }}
                    />
                    <p
                      style={{
                        fontSize: 10,
                        color: '#64748b',
                        fontStyle: 'italic',
                        marginBottom: 8,
                      }}
                    >
                      {L.qrHint}
                    </p>
                    <p
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: '#1e3a5f',
                      }}
                    >
                      {card.student_number}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #e2e8f0',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 7,
                        color: '#94a3b8',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      {L.legalNotice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudentCardView;
