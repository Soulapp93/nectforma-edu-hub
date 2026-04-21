import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { diplomaService } from '@/services/diplomaService';
import { CheckCircle2, XCircle, Loader2, GraduationCap, Calendar, Award, Building2, FileSignature } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DiplomaRecord {
  diploma_number: string;
  verification_code: string;
  status: string;
  student_first_name: string;
  student_last_name: string;
  formation_title: string;
  formation_level?: string;
  academic_year?: string;
  establishment_name?: string;
  general_average?: number | null;
  mention?: string;
  decision?: string;
  jury_date?: string;
  generated_at: string;
}

const mentionLabels: Record<string, string> = {
  tres_bien: 'Très bien', bien: 'Bien', assez_bien: 'Assez bien', passable: 'Passable',
};

const VerifyDiplomaPage: React.FC = () => {
  const { code = '' } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [diploma, setDiploma] = useState<DiplomaRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await diplomaService.verifyByCode(code);
        if (!d) {
          setError('Aucun diplôme trouvé pour ce code de vérification.');
        } else {
          setDiploma(d as DiplomaRecord);
        }
      } catch (err: any) {
        setError(err?.message || 'Erreur lors de la vérification.');
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center px-4 py-12" data-testid="verify-diploma-page">
      <div className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 text-sm">
          <GraduationCap className="h-4 w-4" /> Nectforma
        </Link>

        {loading && (
          <Card className="shadow-xl border-slate-200">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="text-slate-600">Vérification du diplôme en cours...</p>
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card className="shadow-xl border-red-200" data-testid="verify-error">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Diplôme non vérifié</h1>
              <p className="text-slate-600">{error}</p>
              <p className="text-xs text-slate-400 mt-4 font-mono">Code: {code}</p>
            </CardContent>
          </Card>
        )}

        {!loading && diploma && (
          <Card className="shadow-2xl border-emerald-200 overflow-hidden" data-testid="verify-success">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Diplôme authentique</h1>
              <p className="text-white/90 text-sm">Ce diplôme a été délivré par l'établissement ci-dessous.</p>
            </div>

            <CardContent className="p-6 md:p-8 space-y-5">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Titulaire</p>
                <h2 className="text-3xl font-bold text-slate-900" data-testid="verify-name">
                  {diploma.student_first_name} {diploma.student_last_name}
                </h2>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Award} label="Formation" value={diploma.formation_title} />
                {diploma.formation_level && <InfoRow icon={GraduationCap} label="Niveau" value={diploma.formation_level} />}
                {diploma.academic_year && <InfoRow icon={Calendar} label="Année académique" value={diploma.academic_year} />}
                {diploma.establishment_name && <InfoRow icon={Building2} label="Établissement" value={diploma.establishment_name} />}
                {diploma.mention && <InfoRow icon={Award} label="Mention" value={mentionLabels[diploma.mention] || diploma.mention} />}
                {typeof diploma.general_average === 'number' && (
                  <InfoRow icon={Award} label="Moyenne générale" value={`${diploma.general_average.toFixed(2)}/20`} />
                )}
                {diploma.jury_date && (
                  <InfoRow icon={FileSignature} label="Date du jury" value={new Date(diploma.jury_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
                )}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-500 uppercase tracking-wider mb-0.5">Numéro de diplôme</p>
                    <p className="font-mono font-semibold text-slate-900" data-testid="verify-number">{diploma.diploma_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 uppercase tracking-wider mb-0.5">Code de vérification</p>
                    <p className="font-mono font-semibold text-slate-900">{diploma.verification_code}</p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-400 pt-1">
                Vérification effectuée le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} via Nectforma.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ComponentType<any>; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-amber-700" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

export default VerifyDiplomaPage;
