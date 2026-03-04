import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { quizService, Quiz, QuizQuestion, QuizSession } from '@/services/quizService';
import { QUIZ_THEMES } from '@/components/quiz/QuizThemeProvider';
import QuizGameOrchestrator from '@/components/quiz/QuizGameOrchestrator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Plus, Trash2, Play, Settings, BarChart3, 
  Trophy, Zap, Clock, Target, CheckCircle2, XCircle,
  Users, Timer, Sparkles, Eye, ChevronUp, ChevronDown,
  ListOrdered, Type, Sliders, Link2
} from 'lucide-react';
import { Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'QCM', icon: CheckCircle2, desc: 'Choix unique ou multiple' },
  { value: 'true_false', label: 'Vrai / Faux', icon: Target, desc: 'Question binaire' },
  { value: 'open_text', label: 'Réponse libre', icon: Type, desc: 'Texte court' },
  { value: 'ordering', label: 'Classement', icon: ListOrdered, desc: 'Remettre dans l\'ordre' },
  { value: 'matching', label: 'Association', icon: Link2, desc: 'Relier les paires' },
  { value: 'fill_blank', label: 'Texte à trous', icon: Type, desc: 'Compléter la phrase' },
  { value: 'slider', label: 'Curseur', icon: Sliders, desc: 'Valeur numérique' },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary-foreground))', 'hsl(var(--muted-foreground))'];

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => void;
  onClose: () => void;
}

const WorkspaceQuizEditor: React.FC<Props> = ({ document, onSave, onClose }) => {
  const { userId } = useCurrentUser();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [showReport, setShowReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [activeGameSession, setActiveGameSession] = useState<string | null>(null);
  const [canScrollSettings, setCanScrollSettings] = useState(false);
  const [settingsScrollToTop, setSettingsScrollToTop] = useState(false);

  const playScrollRef = useRef<HTMLDivElement | null>(null);
  const reportScrollRef = useRef<HTMLDivElement | null>(null);
  const settingsScrollRef = useRef<HTMLDivElement | null>(null);

  const quizId = (document.content as any)?.quizId;

  const loadQuiz = useCallback(async () => {
    if (!quizId) {
      // Create a new quiz
      if (!userId) return;
      try {
        const newQuiz = await quizService.createQuiz({
          owner_id: userId,
          title: document.title || 'Quiz sans titre',
        });
        const updatedDoc = { ...document, content: { quizId: newQuiz.id } };
        onSave(updatedDoc);
        setQuiz(newQuiz);

        // Apply template questions if any
        const templateQuestions = (document.content as any)?.templateQuestions;
        if (templateQuestions && Array.isArray(templateQuestions) && templateQuestions.length > 0) {
          const createdQuestions: QuizQuestion[] = [];
          for (let i = 0; i < templateQuestions.length; i++) {
            const tq = templateQuestions[i];
            const defaultOptions = tq.options || (tq.type === 'true_false' 
              ? [{ id: 'true', text: 'Vrai', isCorrect: true }, { id: 'false', text: 'Faux', isCorrect: false }]
              : []);
            const q = await quizService.createQuestion({
              quiz_id: newQuiz.id,
              question_type: tq.type as any,
              title: tq.title || 'Question',
              order_index: i,
              options: defaultOptions,
              time_limit: tq.time || 20,
              matching_pairs: tq.matchingPairs || [],
              correct_order: tq.correctOrder || [],
              accepted_answers: tq.acceptedAnswers || [],
              slider_correct: tq.sliderCorrect ?? null,
            });
            createdQuestions.push(q);
          }
          setQuestions(createdQuestions);
        }

        setLoading(false);
      } catch (err: any) {
        toast.error('Erreur création quiz');
        console.error(err);
        setLoading(false);
      }
      return;
    }

    try {
      const [q, qs, ss] = await Promise.all([
        quizService.getQuiz(quizId),
        quizService.getQuestions(quizId),
        quizService.getActiveSessions(quizId),
      ]);
      setQuiz(q);
      setQuestions(qs);
      setSessions(ss);
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement quiz');
    } finally {
      setLoading(false);
    }
  }, [quizId, userId, document, onSave]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  const updateSettingsScrollState = useCallback(() => {
    const container = settingsScrollRef.current;
    if (!container) {
      setCanScrollSettings(false);
      setSettingsScrollToTop(false);
      return;
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    setCanScrollSettings(maxScrollTop > 16);
    setSettingsScrollToTop(container.scrollTop > Math.max(32, maxScrollTop - 140));
  }, []);

  const scrollSettingsForm = () => {
    const container = settingsScrollRef.current;
    if (!container) return;

    const targetTop = settingsScrollToTop
      ? 0
      : Math.min(
          container.scrollHeight,
          container.scrollTop + Math.max(220, Math.floor(container.clientHeight * 0.65))
        );

    container.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  useEffect(() => {
    const target = activeTab === 'play' ? playScrollRef.current : activeTab === 'reports' ? reportScrollRef.current : null;
    if (target) target.scrollTo({ top: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    if (!showSettings) return;
    const frame = requestAnimationFrame(updateSettingsScrollState);
    return () => cancelAnimationFrame(frame);
  }, [showSettings, quiz, updateSettingsScrollState]);

  const saveQuizSettings = async (updates: Partial<Quiz>) => {
    if (!quiz) return;
    try {
      const updated = await quizService.updateQuiz(quiz.id, updates);
      setQuiz(updated);
      toast.success('Paramètres sauvegardés');
    } catch { toast.error('Erreur'); }
  };

  const addQuestion = async (type: string) => {
    if (!quiz) return;
    const defaultOptions = type === 'true_false' 
      ? [{ id: 'true', text: 'Vrai', isCorrect: true }, { id: 'false', text: 'Faux', isCorrect: false }]
      : type === 'mcq' 
        ? [{ id: '1', text: 'Option A', isCorrect: true }, { id: '2', text: 'Option B', isCorrect: false }, { id: '3', text: 'Option C', isCorrect: false }, { id: '4', text: 'Option D', isCorrect: false }]
        : [];

    try {
      const q = await quizService.createQuestion({
        quiz_id: quiz.id,
        question_type: type as any,
        title: 'Nouvelle question',
        order_index: questions.length,
        options: defaultOptions,
        matching_pairs: type === 'matching' ? [{ left: 'Élément A', right: 'Réponse A' }, { left: 'Élément B', right: 'Réponse B' }] : [],
        correct_order: type === 'ordering' ? ['item1', 'item2', 'item3'] : [],
        accepted_answers: type === 'fill_blank' || type === 'open_text' ? ['réponse'] : [],
        slider_correct: type === 'slider' ? 50 : null,
      });
      setQuestions(prev => [...prev, q]);
      setSelectedQuestion(questions.length);
      setShowAddQuestion(false);
      toast.success('Question ajoutée');
    } catch { toast.error('Erreur'); }
  };

  const updateQuestion = async (index: number, updates: Partial<QuizQuestion>) => {
    const q = questions[index];
    if (!q) return;
    try {
      const updated = await quizService.updateQuestion(q.id, updates);
      setQuestions(prev => prev.map((qq, i) => i === index ? updated : qq));
    } catch { toast.error('Erreur'); }
  };

  const deleteQuestion = async (index: number) => {
    const q = questions[index];
    if (!q) return;
    try {
      await quizService.deleteQuestion(q.id);
      setQuestions(prev => prev.filter((_, i) => i !== index));
      if (selectedQuestion === index) setSelectedQuestion(null);
      else if (selectedQuestion && selectedQuestion > index) setSelectedQuestion(selectedQuestion - 1);
      toast.success('Question supprimée');
    } catch { toast.error('Erreur'); }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
    setSelectedQuestion(newIndex);
    await quizService.reorderQuestions(quiz!.id, newQuestions.map(q => q.id));
  };

  const startLiveSession = async () => {
    if (!quiz || !userId) return;
    try {
      const session = await quizService.createSession({
        quiz_id: quiz.id,
        host_id: userId,
        mode: 'live',
      });
      setSessions(prev => [session, ...prev]);
      setActiveGameSession(session.id);
    } catch { toast.error('Erreur'); }
  };

  const startAsyncSession = async () => {
    if (!quiz || !userId) return;
    try {
      const session = await quizService.createSession({
        quiz_id: quiz.id,
        host_id: userId,
        mode: 'async',
      });
      toast.success('Session asynchrone créée !');
      setSessions(prev => [session, ...prev]);
    } catch { toast.error('Erreur'); }
  };

  const loadReport = async (sessionId: string) => {
    try {
      const report = await quizService.getSessionReport(sessionId);
      setReportData(report);
      setShowReport(sessionId);
    } catch { toast.error('Erreur chargement rapport'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-0 bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If game is active, show orchestrator
  if (activeGameSession) {
    return (
      <div className="h-full min-h-0">
        <QuizGameOrchestrator
          sessionId={activeGameSession}
          isHost={true}
          onExit={() => { setActiveGameSession(null); loadQuiz(); }}
        />
      </div>
    );
  }

  const currentQuestion = selectedQuestion !== null ? questions[selectedQuestion] : null;

  return (
    <div className="workspace-editor overflow-hidden">
      <div className="workspace-header flex-wrap gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0 rounded-lg">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <Input
            value={quiz?.title || ''}
            onChange={e => setQuiz(prev => (prev ? { ...prev, title: e.target.value } : null))}
            onBlur={() => quiz && saveQuizSettings({ title: quiz.title })}
            className="workspace-title-input flex-1 min-w-0 focus-visible:ring-0"
            placeholder="Titre du quiz"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Badge variant={quiz?.is_published ? 'default' : 'secondary'} className="gap-1 text-xs h-6">
            {quiz?.is_published ? <Eye className="h-3 w-3" /> : null}
            {quiz?.is_published ? 'Publié' : 'Brouillon'}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs h-6">
            <Target className="h-3 w-3" /> {questions.length}
          </Badge>
          <Button variant="outline" size="xs" onClick={() => setShowSettings(true)} className="gap-1 rounded-xl">
            <Settings className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Paramètres</span>
          </Button>
          <Button
            size="xs"
            onClick={() => saveQuizSettings({ is_published: !quiz?.is_published })}
            variant={quiz?.is_published ? 'secondary' : 'default'}
            className="gap-1 rounded-xl"
          >
            {quiz?.is_published ? 'Dépublier' : 'Publier'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="workspace-menubar px-2 sm:px-3 py-2 border-b border-border/50 overflow-x-auto">
          <TabsList className="bg-muted/60 w-max min-w-full sm:min-w-0 sm:w-auto justify-start">
            <TabsTrigger value="questions" className="gap-1 text-xs sm:text-sm">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Questions
            </TabsTrigger>
            <TabsTrigger value="play" className="gap-1 text-xs sm:text-sm">
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Lancer
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Rapports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="questions" className="m-0 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden flex-col md:flex-row">
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex flex-col bg-muted/30 shrink-0 min-h-[220px] max-h-[40dvh] md:max-h-none md:min-h-0">
            <div className="p-2 sm:p-3 border-b border-border shrink-0">
              <Button onClick={() => setShowAddQuestion(true)} className="w-full gap-1.5 rounded-xl" size="sm">
                <Plus className="h-4 w-4" /> Ajouter une question
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2 space-y-1.5">
                {questions.map((q, i) => {
                  const TypeIcon = QUESTION_TYPES.find(t => t.value === q.question_type)?.icon || Target;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestion(i)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all group flex items-start gap-2 ${
                        selectedQuestion === i
                          ? 'bg-primary/10 border border-primary/30 shadow-sm'
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <span className="text-xs font-bold text-muted-foreground mt-0.5 min-w-[18px]">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <TypeIcon className="h-3 w-3 text-primary shrink-0" />
                          <span className="text-[10px] text-muted-foreground truncate">{QUESTION_TYPES.find(t => t.value === q.question_type)?.label}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium leading-snug break-words">{q.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{q.time_limit}s</span>
                          <span className="flex items-center gap-0.5"><Trophy className="h-2.5 w-2.5" />{q.points}pts</span>
                        </div>
                      </div>
                      <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex flex-col gap-0.5">
                        <button onClick={e => { e.stopPropagation(); moveQuestion(i, 'up'); }} className="p-0.5 hover:bg-muted rounded"><ChevronUp className="h-3 w-3" /></button>
                        <button onClick={e => { e.stopPropagation(); moveQuestion(i, 'down'); }} className="p-0.5 hover:bg-muted rounded"><ChevronDown className="h-3 w-3" /></button>
                      </div>
                    </button>
                  );
                })}
                {questions.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucune question</p>
                    <p className="text-xs">Cliquez sur + pour commencer</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-0">
            {currentQuestion ? (
              <QuestionEditor
                question={currentQuestion}
                index={selectedQuestion!}
                onUpdate={updateQuestion}
                onDelete={() => deleteQuestion(selectedQuestion!)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <Sparkles className="h-12 sm:h-16 w-12 sm:w-16 mb-4 opacity-20" />
                <p className="text-base sm:text-lg font-medium">Sélectionnez une question</p>
                <p className="text-sm">ou ajoutez-en une nouvelle</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="play" className="m-0 flex-1 min-h-0 overflow-hidden data-[state=active]:block">
          <div ref={playScrollRef} className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-5xl p-3 sm:p-5 lg:p-6 space-y-4">
              <Card className="p-4 sm:p-5 border-border/60 bg-card/95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Play className="h-5 w-5 text-primary" /> Lancer une session
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Démarrez rapidement une session en direct ou asynchrone.</p>
                  </div>
                  <Badge variant="outline" className="w-fit">{questions.length} question{questions.length > 1 ? 's' : ''}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={startLiveSession}
                    disabled={questions.length === 0}
                    className="p-4 sm:p-5 rounded-2xl border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-base">Mode Live</h4>
                    <p className="text-sm text-muted-foreground mt-1">Tous les participants jouent en même temps avec un classement en temps réel.</p>
                  </button>

                  <button
                    onClick={startAsyncSession}
                    disabled={questions.length === 0}
                    className="p-4 sm:p-5 rounded-2xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-3">
                      <Timer className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-base">Mode Asynchrone</h4>
                    <p className="text-sm text-muted-foreground mt-1">Chaque participant joue à son rythme quand il le souhaite.</p>
                  </button>
                </div>
              </Card>

              <Card className="p-4 sm:p-5 border-border/60 bg-card/95">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" /> Sessions actives
                  </h3>
                  <Badge variant="secondary">{sessions.length}</Badge>
                </div>

                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-muted/35 border border-border/60">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={s.mode === 'live' ? 'destructive' : 'default'}>
                              {s.mode === 'live' ? '🔴 Live' : '⏱ Async'}
                            </Badge>
                            <Badge variant="outline">{s.status}</Badge>
                          </div>
                          {s.mode === 'live' && <p className="text-base sm:text-lg font-mono font-bold mt-1">PIN: {s.pin_code}</p>}
                        </div>
                        <div className="flex gap-2 w-full lg:w-auto">
                          {s.status !== 'finished' && (
                            <Button size="sm" onClick={() => setActiveGameSession(s.id)} className="rounded-xl gap-1 flex-1 lg:flex-none">
                              <Play className="h-3.5 w-3.5" /> Ouvrir
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => loadReport(s.id)} className="rounded-xl gap-1 flex-1 lg:flex-none">
                            <BarChart3 className="h-3.5 w-3.5" /> Rapport
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Aucune session active pour le moment.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="m-0 flex-1 min-h-0 overflow-hidden data-[state=active]:block">
          <div ref={reportScrollRef} className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-5xl p-3 sm:p-5 lg:p-6">
              {reportData ? (
                <ReportView data={reportData} onClose={() => { setReportData(null); setShowReport(null); }} />
              ) : (
                <Card className="p-4 sm:p-6 border-border/60 bg-card/95">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" /> Historique des sessions
                    </h3>
                    <Badge variant="secondary">{sessions.length}</Badge>
                  </div>

                  {sessions.length > 0 ? (
                    <div className="space-y-2.5">
                      {sessions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => loadReport(s.id)}
                          className="w-full text-left p-3 rounded-xl hover:bg-muted/60 border border-border/60 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <Badge variant={s.mode === 'live' ? 'destructive' : 'default'} className="mb-1">
                              {s.mode === 'live' ? 'Live' : 'Async'}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {new Date(s.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <BarChart3 className="h-5 w-5 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                      Aucune session disponible pour le moment.
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une question</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {QUESTION_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => addQuestion(type.value)}
                  className="flex items-start gap-3 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="relative w-[96vw] max-w-2xl h-[90dvh] sm:h-auto sm:max-h-[90dvh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 sm:px-5 py-4 border-b border-border/60 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Paramètres du quiz
            </DialogTitle>
          </DialogHeader>

          {quiz && (
            <div
              ref={settingsScrollRef}
              onScroll={updateSettingsScrollState}
              className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4"
            >
              <div className="space-y-4 pb-8">
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={quiz.description || ''}
                    onChange={e => setQuiz({ ...quiz, description: e.target.value })}
                    placeholder="Description du quiz..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Temps par question (sec)</Label>
                    <Input
                      type="number"
                      value={quiz.time_per_question}
                      onChange={e => setQuiz({ ...quiz, time_per_question: parseInt(e.target.value) || 30 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Points par question</Label>
                    <Input
                      type="number"
                      value={quiz.points_per_question}
                      onChange={e => setQuiz({ ...quiz, points_per_question: parseInt(e.target.value) || 1000 })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Mode de jeu</Label>
                  <Select value={quiz.mode} onValueChange={v => setQuiz({ ...quiz, mode: v as any })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live uniquement</SelectItem>
                      <SelectItem value="async">Asynchrone uniquement</SelectItem>
                      <SelectItem value="both">Les deux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>🎨 Thème visuel</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {Object.values(QUIZ_THEMES).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setQuiz({ ...quiz, theme_preset: t.id })}
                        className={`p-2 rounded-xl border-2 transition-all text-xs font-medium ${
                          quiz.theme_preset === t.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="w-full h-6 rounded-lg mb-1" style={{ background: t.bgGradient }} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">🎵 Audio en jeu</p>
                    <p className="text-xs text-muted-foreground">Sons et effets pendant le quiz</p>
                  </div>
                  <Switch checked={quiz.audio_enabled} onCheckedChange={v => setQuiz({ ...quiz, audio_enabled: v })} />
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'bonus_speed_points', label: 'Bonus de vitesse', desc: 'Plus de points si réponse rapide' },
                    { key: 'streak_bonus_enabled', label: 'Bonus de série', desc: 'Points bonus pour réponses consécutives correctes' },
                    { key: 'shuffle_questions', label: 'Mélanger les questions', desc: 'Ordre aléatoire à chaque session' },
                    { key: 'shuffle_options', label: 'Mélanger les options', desc: 'Ordre aléatoire des réponses' },
                    { key: 'show_correct_answer', label: 'Afficher la bonne réponse', desc: 'Montrer la correction après chaque question' },
                    { key: 'show_leaderboard_after_each', label: 'Classement après chaque question', desc: 'Afficher le top du classement' },
                    { key: 'allow_teams', label: 'Mode équipes', desc: 'Permettre de jouer en équipes' },
                    { key: 'power_ups_enabled', label: 'Power-ups', desc: 'Bonus spéciaux pendant le jeu' },
                  ].map(setting => (
                    <div key={setting.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{setting.label}</p>
                        <p className="text-xs text-muted-foreground">{setting.desc}</p>
                      </div>
                      <Switch
                        checked={(quiz as any)[setting.key]}
                        onCheckedChange={v => setQuiz({ ...quiz, [setting.key]: v })}
                        className="shrink-0"
                      />
                    </div>
                  ))}
                </div>

                {quiz.allow_teams && (
                  <div>
                    <Label>Taille max des équipes</Label>
                    <Input
                      type="number"
                      value={quiz.max_team_size}
                      onChange={e => setQuiz({ ...quiz, max_team_size: parseInt(e.target.value) || 4 })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {canScrollSettings && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={scrollSettingsForm}
              className="absolute bottom-20 right-4 z-10 rounded-full shadow-sm border border-border"
              aria-label={settingsScrollToTop ? 'Revenir en haut du formulaire' : 'Descendre dans le formulaire'}
            >
              {settingsScrollToTop ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}

          <DialogFooter className="shrink-0 px-4 sm:px-5 py-3 border-t border-border/60">
            <Button onClick={() => { if (quiz) saveQuizSettings(quiz); setShowSettings(false); }} className="rounded-xl">
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ====== Question Editor Component ======
const QuestionEditor: React.FC<{
  question: QuizQuestion;
  index: number;
  onUpdate: (index: number, updates: Partial<QuizQuestion>) => void;
  onDelete: () => void;
}> = ({ question, index, onUpdate, onDelete }) => {
  const [localQ, setLocalQ] = useState(question);

  useEffect(() => { setLocalQ(question); }, [question]);

  const save = (updates: Partial<QuizQuestion>) => {
    setLocalQ(prev => ({ ...prev, ...updates }));
    onUpdate(index, updates);
  };

  const updateOption = (optIndex: number, updates: any) => {
    const newOptions = [...(localQ.options || [])];
    newOptions[optIndex] = { ...newOptions[optIndex], ...updates };
    save({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(localQ.options || []), { id: Date.now().toString(), text: `Option ${(localQ.options?.length || 0) + 1}`, isCorrect: false }];
    save({ options: newOptions });
  };

  const removeOption = (optIndex: number) => {
    save({ options: (localQ.options || []).filter((_: any, i: number) => i !== optIndex) });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <Badge className="gap-1">Question {index + 1}</Badge>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive gap-1">
          <Trash2 className="h-4 w-4" /> Supprimer
        </Button>
      </div>

      <div>
        <Label>Question</Label>
        <Textarea value={localQ.title} onChange={e => setLocalQ({ ...localQ, title: e.target.value })}
          onBlur={() => save({ title: localQ.title })}
          className="mt-1 text-lg sm:text-xl font-bold text-center min-h-[80px]" rows={3} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Temps (sec)</Label>
          <Input type="number" value={localQ.time_limit} onChange={e => save({ time_limit: parseInt(e.target.value) || 30 })} className="mt-1" />
        </div>
        <div>
          <Label className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Points</Label>
          <Input type="number" value={localQ.points} onChange={e => save({ points: parseInt(e.target.value) || 1000 })} className="mt-1" />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={localQ.question_type} onValueChange={v => save({ question_type: v as any })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Options for MCQ / True-False */}
      {(localQ.question_type === 'mcq' || localQ.question_type === 'true_false') && (
        <div className="space-y-3">
          <Label>Options de réponse</Label>
          {(localQ.options || []).map((opt: any, i: number) => (
            <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              opt.isCorrect ? 'border-success/40 bg-success/10' : 'border-border'
            }`}>
              <button onClick={() => updateOption(i, { isCorrect: !opt.isCorrect })}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  opt.isCorrect ? 'bg-success text-success-foreground' : 'bg-muted hover:bg-muted-foreground/20'
                }`}>
                {opt.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
              </button>
              <Input value={opt.text} onChange={e => updateOption(i, { text: e.target.value })}
                className="border-none bg-transparent focus-visible:ring-0" placeholder={`Option ${i + 1}`} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {localQ.question_type === 'mcq' && (localQ.options || []).length > 2 && (
                <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {localQ.question_type === 'mcq' && (
            <Button variant="outline" size="sm" onClick={addOption} className="gap-1 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Ajouter une option
            </Button>
          )}
        </div>
      )}

      {/* Open text / Fill blank */}
      {(localQ.question_type === 'open_text' || localQ.question_type === 'fill_blank') && (
        <div className="space-y-3">
          <Label>Réponses acceptées</Label>
          {(localQ.accepted_answers || []).map((ans: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={ans} onChange={e => {
                const newAnswers = [...(localQ.accepted_answers || [])];
                newAnswers[i] = e.target.value;
                save({ accepted_answers: newAnswers });
              }} placeholder="Réponse acceptée" />
              <button onClick={() => save({ accepted_answers: (localQ.accepted_answers || []).filter((_: string, j: number) => j !== i) })}
                className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => save({ accepted_answers: [...(localQ.accepted_answers || []), ''] })} className="gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Ajouter une réponse
          </Button>
        </div>
      )}

      {/* Matching */}
      {localQ.question_type === 'matching' && (
        <div className="space-y-3">
          <Label>Paires à associer</Label>
          {(localQ.matching_pairs || []).map((pair: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={pair.left} onChange={e => {
                const pairs = [...(localQ.matching_pairs || [])];
                pairs[i] = { ...pairs[i], left: e.target.value };
                save({ matching_pairs: pairs });
              }} placeholder="Élément" className="flex-1" />
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input value={pair.right} onChange={e => {
                const pairs = [...(localQ.matching_pairs || [])];
                pairs[i] = { ...pairs[i], right: e.target.value };
                save({ matching_pairs: pairs });
              }} placeholder="Correspondance" className="flex-1" />
              <button onClick={() => save({ matching_pairs: (localQ.matching_pairs || []).filter((_: any, j: number) => j !== i) })}
                className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => save({ matching_pairs: [...(localQ.matching_pairs || []), { left: '', right: '' }] })} className="gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Ajouter une paire
          </Button>
        </div>
      )}

      {/* Slider */}
      {localQ.question_type === 'slider' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <Label>Min</Label>
            <Input type="number" value={localQ.slider_min} onChange={e => save({ slider_min: parseInt(e.target.value) || 0 })} className="mt-1" />
          </div>
          <div>
            <Label>Max</Label>
            <Input type="number" value={localQ.slider_max} onChange={e => save({ slider_max: parseInt(e.target.value) || 100 })} className="mt-1" />
          </div>
          <div>
            <Label>Bonne réponse</Label>
            <Input type="number" value={localQ.slider_correct ?? ''} onChange={e => save({ slider_correct: parseInt(e.target.value) })} className="mt-1" />
          </div>
          <div>
            <Label>Tolérance ±</Label>
            <Input type="number" value={localQ.slider_tolerance} onChange={e => save({ slider_tolerance: parseInt(e.target.value) || 5 })} className="mt-1" />
          </div>
        </div>
      )}

      {/* Ordering */}
      {localQ.question_type === 'ordering' && (
        <div className="space-y-3">
          <Label>Éléments dans le bon ordre</Label>
          {(localQ.correct_order || []).map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <Badge variant="outline" className="shrink-0">{i + 1}</Badge>
              <Input value={item} onChange={e => {
                const order = [...(localQ.correct_order || [])];
                order[i] = e.target.value;
                save({ correct_order: order });
              }} placeholder={`Élément ${i + 1}`} />
              <button onClick={() => save({ correct_order: (localQ.correct_order || []).filter((_: string, j: number) => j !== i) })}
                className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => save({ correct_order: [...(localQ.correct_order || []), ''] })} className="gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Ajouter un élément
          </Button>
        </div>
      )}

      {/* Explanation */}
      <div>
        <Label>Explication (affichée après la réponse)</Label>
        <Textarea value={localQ.explanation || ''} onChange={e => save({ explanation: e.target.value })}
          className="mt-1" placeholder="Explication optionnelle..." rows={2} />
      </div>
    </div>
  );
};

// ====== Report View Component ======
const ReportView: React.FC<{ data: any; onClose: () => void }> = ({ data, onClose }) => {
  const CHART_COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Rapport de session
        </h2>
        <Button variant="outline" onClick={onClose} className="rounded-xl">Fermer</Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Participants', value: data.totalParticipants, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Score moyen', value: data.avgScore, icon: Trophy, color: 'from-amber-500 to-amber-600' },
          { label: 'Complétion', value: `${data.completionRate}%`, icon: Target, color: 'from-green-500 to-green-600' },
          { label: 'Questions', value: data.questionStats.length, icon: Zap, color: 'from-purple-500 to-purple-600' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-2`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Podium */}
      {data.participants.length >= 3 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🏆 Podium</h3>
          <div className="flex items-end justify-center gap-4">
            {[data.participants[1], data.participants[0], data.participants[2]].map((p: any, i: number) => {
              const heights = ['h-24', 'h-32', 'h-16'];
              const medals = ['🥈', '🥇', '🥉'];
              return p ? (
                <div key={p.id} className="flex flex-col items-center">
                  <span className="text-3xl mb-2">{medals[i]}</span>
                  <p className="font-bold text-sm truncate max-w-[100px]">{p.nickname || 'Joueur'}</p>
                  <p className="text-sm text-muted-foreground">{p.total_score} pts</p>
                  <div className={`${heights[i]} w-20 rounded-t-xl bg-gradient-to-b from-primary/30 to-primary/10 mt-2`} />
                </div>
              ) : null;
            })}
          </div>
        </Card>
      )}

      {/* Question stats */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Résultats par question</h3>
        <div className="space-y-4">
          {data.questionStats.map((qs: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Q{i + 1}: {qs.question.title}</p>
                  <p className="text-sm text-muted-foreground">{qs.totalAnswers} réponses · Temps moyen: {Math.round(qs.avgTimeMs / 1000)}s</p>
                </div>
                <Badge variant={qs.successRate >= 70 ? 'default' : qs.successRate >= 40 ? 'secondary' : 'destructive'}>
                  {qs.successRate}% correct
                </Badge>
              </div>
              {qs.answerDistribution.length > 0 && (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={qs.answerDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Réponses">
                        {qs.answerDistribution.map((entry: any, idx: number) => (
                          <Cell key={idx} fill={entry.isCorrect ? '#10B981' : CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Full leaderboard */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Classement complet</h3>
        <div className="space-y-2">
          {data.participants.map((p: any, i: number) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-8 text-center text-muted-foreground">#{i + 1}</span>
                <div>
                  <p className="font-medium">{p.nickname || 'Joueur'}</p>
                  <p className="text-xs text-muted-foreground">{p.correct_answers}/{p.total_answered} correctes · Meilleure série: {p.best_streak}</p>
                </div>
              </div>
              <p className="font-bold text-lg">{p.total_score} pts</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WorkspaceQuizEditor;
