import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { questionnaireService, Questionnaire, QuestionnaireQuestion } from '@/services/questionnaireService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Star, AlertCircle, Loader2 } from 'lucide-react';

const QuestionnairePublic = () => {
  const { token } = useParams<{ token: string }>();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const q = await questionnaireService.getQuestionnaireByToken(token);
        if (!q) { toast.error('Questionnaire introuvable'); return; }
        if (!q.is_accepting_responses) { toast.error('Ce questionnaire n\'accepte plus de réponses'); }
        const qs = await questionnaireService.getQuestions(q.id);
        setQuestionnaire(q);
        setQuestions(q.shuffle_questions ? [...qs].sort(() => Math.random() - 0.5) : qs);
      } catch { toast.error('Erreur'); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const isQuestionVisible = (q: QuestionnaireQuestion) => {
    if (!q.condition_question_id) return true;
    const condAnswer = answers[q.condition_question_id];
    if (!condAnswer) return false;
    if (q.condition_operator === 'equals' || !q.condition_operator) {
      return String(condAnswer) === q.condition_value || (Array.isArray(condAnswer) && condAnswer.includes(q.condition_value));
    }
    return true;
  };

  const visibleQuestions = questions.filter(isQuestionVisible);
  const answeredCount = visibleQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null).length;
  const progress = visibleQuestions.length > 0 ? (answeredCount / visibleQuestions.length) * 100 : 0;

  const setAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[questionId]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    visibleQuestions.forEach(q => {
      if (q.is_required) {
        const a = answers[q.id];
        if (a === undefined || a === null || a === '' || (Array.isArray(a) && a.length === 0)) {
          errs[q.id] = 'Cette question est obligatoire';
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!questionnaire || !validate()) {
      toast.error('Veuillez répondre à toutes les questions obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      // Calculate score
      let score: number | null = null;
      let maxScore: number | null = null;
      if (questionnaire.scoring_enabled) {
        score = 0;
        maxScore = 0;
        visibleQuestions.forEach(q => {
          maxScore! += q.points;
          if (['single_choice', 'dropdown'].includes(q.question_type)) {
            const correct = q.options?.find(o => o.is_correct);
            if (correct && answers[q.id] === correct.label) score! += q.points;
          }
          if (q.question_type === 'multiple_choice') {
            const correctLabels = q.options?.filter(o => o.is_correct).map(o => o.label) || [];
            const answerValues = answers[q.id] || [];
            if (JSON.stringify([...correctLabels].sort()) === JSON.stringify([...answerValues].sort())) score! += q.points;
          }
        });
      }

      const response = await questionnaireService.createResponse({
        questionnaire_id: questionnaire.id,
        respondent_name: respondentName || null,
        respondent_email: respondentEmail || null,
        score,
        max_score: maxScore,
        completed_at: new Date().toISOString(),
      });

      const answersData = visibleQuestions.map(q => ({
        response_id: response.id,
        question_id: q.id,
        answer_text: typeof answers[q.id] === 'string' ? answers[q.id] : null,
        answer_values: Array.isArray(answers[q.id]) ? answers[q.id] : null,
        points_earned: 0,
      }));

      await questionnaireService.submitAnswers(answersData);
      setSubmitted(true);
      toast.success('Réponse envoyée !');
    } catch (err) {
      logger.error(err);
      toast.error('Erreur lors de l\'envoi');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Questionnaire introuvable</h2>
          <p className="text-muted-foreground">Ce lien est invalide ou le questionnaire a été supprimé.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: questionnaire.theme_color + '20' }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: questionnaire.theme_color }} />
          </div>
          <h2 className="text-xl font-bold mb-2">Merci !</h2>
          <p className="text-muted-foreground">{questionnaire.confirmation_message}</p>
        </Card>
      </div>
    );
  }

  if (!questionnaire.is_accepting_responses) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">Questionnaire fermé</h2>
          <p className="text-muted-foreground">Ce questionnaire n'accepte plus de réponses.</p>
        </Card>
      </div>
    );
  }

  const renderQuestionInput = (q: QuestionnaireQuestion) => {
    const value = answers[q.id];
    
    switch (q.question_type) {
      case 'short_text':
      case 'email':
      case 'phone':
      case 'url':
        return <Input value={value || ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Votre réponse..." type={q.question_type === 'email' ? 'email' : q.question_type === 'phone' ? 'tel' : q.question_type === 'url' ? 'url' : 'text'} />;

      case 'long_text':
        return <Textarea value={value || ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Votre réponse..." rows={4} />;

      case 'number':
        return <Input type="number" value={value || ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="0" />;

      case 'date':
        return <Input type="date" value={value || ''} onChange={e => setAnswer(q.id, e.target.value)} />;

      case 'time':
        return <Input type="time" value={value || ''} onChange={e => setAnswer(q.id, e.target.value)} />;

      case 'single_choice':
      case 'dropdown':
        return (
          <div className="space-y-2">
            {q.options?.map(opt => (
              <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${value === opt.label ? '' : 'border-border hover:border-primary/30'}`} style={value === opt.label ? { borderColor: questionnaire.theme_color, backgroundColor: questionnaire.theme_color + '10' } : undefined}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`} style={value === opt.label ? { borderColor: questionnaire.theme_color } : { borderColor: 'hsl(var(--muted-foreground) / 0.3)' }}>
                  {value === opt.label && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: questionnaire.theme_color }} />}
                </div>
                <span className="text-sm">{opt.label}</span>
                <input type="radio" name={q.id} value={opt.label} checked={value === opt.label} onChange={() => setAnswer(q.id, opt.label)} className="sr-only" />
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {q.options?.map(opt => {
              const selected = Array.isArray(value) && value.includes(opt.label);
              return (
                <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? '' : 'border-border hover:border-primary/30'}`} style={selected ? { borderColor: questionnaire.theme_color, backgroundColor: questionnaire.theme_color + '10' } : undefined}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center`} style={selected ? { borderColor: questionnaire.theme_color, backgroundColor: questionnaire.theme_color } : { borderColor: 'hsl(var(--muted-foreground) / 0.3)' }}>
                    {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                  <input type="checkbox" checked={selected} onChange={() => {
                    const current = Array.isArray(value) ? [...value] : [];
                    if (selected) setAnswer(q.id, current.filter(v => v !== opt.label));
                    else setAnswer(q.id, [...current, opt.label]);
                  }} className="sr-only" />
                </label>
              );
            })}
          </div>
        );

      case 'linear_scale':
        const min = q.settings?.min || 1;
        const max = q.settings?.max || 5;
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{q.settings?.minLabel || min}</span>
              <span>{q.settings?.maxLabel || max}</span>
            </div>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => (
                <button
                  key={n}
                  onClick={() => setAnswer(q.id, String(n))}
                  className={`w-10 h-10 rounded-full border-2 font-medium text-sm transition-all ${String(value) === String(n) ? 'text-white' : 'border-border hover:border-primary/30'}`}
                  style={String(value) === String(n) ? { borderColor: questionnaire.theme_color, backgroundColor: questionnaire.theme_color } : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );

      case 'rating':
        const rating = parseInt(value) || 0;
        return (
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setAnswer(q.id, String(i))} className="p-1">
                <Star className={`h-8 w-8 transition-colors ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>
        );

      default:
        return <Input value={value || ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Votre réponse..." />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card className="p-6 border-t-4" style={{ borderTopColor: questionnaire.theme_color }}>
          <h1 className="text-2xl font-bold">{questionnaire.title}</h1>
          {questionnaire.description && (
            <p className="text-muted-foreground mt-2">{questionnaire.description}</p>
          )}
          {questionnaire.show_progress_bar && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{answeredCount}/{visibleQuestions.length} questions</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </Card>

        {/* Respondent info */}
        <Card className="p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Votre nom (optionnel)</Label>
              <Input value={respondentName} onChange={e => setRespondentName(e.target.value)} placeholder="Nom complet" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Votre email (optionnel)</Label>
              <Input value={respondentEmail} onChange={e => setRespondentEmail(e.target.value)} placeholder="email@exemple.com" type="email" className="mt-1" />
            </div>
          </div>
        </Card>

        {/* Questions */}
        {visibleQuestions.map((q, idx) => (
          <Card key={q.id} className={`p-5 space-y-3 ${errors[q.id] ? 'border-destructive border-2' : ''}`}>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5">{idx + 1}</Badge>
              <div className="flex-1">
                <p className="font-medium">
                  {q.title || 'Question sans titre'}
                  {q.is_required && <span className="text-destructive ml-1">*</span>}
                </p>
                {q.description && <p className="text-sm text-muted-foreground mt-1">{q.description}</p>}
              </div>
            </div>
            {renderQuestionInput(q)}
            {errors[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
          </Card>
        ))}

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gap-2" style={{ backgroundColor: questionnaire.theme_color }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? 'Envoi...' : 'Envoyer mes réponses'}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-8">
          Propulsé par Nectforma
        </p>
      </div>
    </div>
  );
};

export default QuestionnairePublic;
