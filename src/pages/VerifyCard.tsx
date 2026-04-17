import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentCardService } from '@/services/studentCardService';
import { CheckCircle, XCircle, Loader2, CreditCard, GraduationCap, Calendar, AlertTriangle } from 'lucide-react';

const VerifyCard: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    studentCardService.getCardByVerificationCode(code).then(d => {
      setData(d);
      if (!d) setError(true);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Carte non trouvee</h2>
            <p className="text-sm text-muted-foreground text-center">Ce code de verification n'est pas valide ou la carte a ete revoquee.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = data.status === 'active' && new Date(data.valid_until) >= new Date();
  const isExpired = new Date(data.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Verification de carte etudiant</h1>
          <p className="text-sm text-muted-foreground mt-1">{data.establishments?.name || 'Etablissement'}</p>
        </div>

        {/* Status */}
        <Card className={isActive ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/50'}>
          <CardContent className="flex items-center gap-4 p-4">
            {isActive ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Carte valide</p>
                  <p className="text-xs text-emerald-600">Cette carte etudiant est authentique et active.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">{isExpired ? 'Carte expiree' : 'Carte revoquee'}</p>
                  <p className="text-xs text-red-600">{isExpired ? 'Cette carte a expire.' : 'Cette carte a ete revoquee.'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Student info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Numero etudiant</p>
                <p className="text-sm font-bold font-mono">{data.student_number}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Statut</p>
                <Badge className={isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                  {isActive ? 'Actif' : isExpired ? 'Expire' : 'Revoque'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1"><GraduationCap className="h-3 w-3" />Formation</p>
                <p className="text-sm font-medium">{data.formations?.title || ''}</p>
                <p className="text-xs text-muted-foreground">{data.formations?.level || ''}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />Validite</p>
                <p className="text-xs">{new Date(data.valid_from).toLocaleDateString('fr-FR')} — {new Date(data.valid_until).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center">
          Verification effectuee le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default VerifyCard;
