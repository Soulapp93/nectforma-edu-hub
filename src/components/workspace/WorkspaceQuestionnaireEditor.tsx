import React, { useState, useEffect, useCallback } from 'react';
import { WorkspaceDocument } from '@/services/workspaceService';
import { questionnaireService, Questionnaire, QuestionnaireQuestion, QuestionnaireOption, QuestionnaireSection } from '@/services/questionnaireService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ShareDocumentModal from './ShareDocumentModal';
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, Copy, Eye, Settings,
  BarChart3, Share2, Link2, CheckCircle2, Circle, Square, CheckSquare,
  AlignLeft, Hash, Calendar, Clock, Upload, Star, ArrowUpDown, Grid3X3,
  Mail, Phone, Globe, Type, ChevronDown, ToggleLeft, Layers, Zap,
  PieChart, TrendingUp, Users, FileText, ExternalLink, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

interface Props {
  document: WorkspaceDocument;
  onSave: (doc: WorkspaceDocument) => Promise<void>;
  onClose: () => void;
}

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Texte court', icon: Type },
  { value: 'long_text', label: 'Texte long', icon: AlignLeft },
  { value: 'single_choice', label: 'Choix unique', icon: Circle },
  { value: 'multiple_choice', label: 'Choix multiples', icon: CheckSquare },
  { value: 'dropdown', label: 'Liste déroulante', icon: ChevronDown },
  { value: 'linear_scale', label: 'Échelle linéaire', icon: ArrowUpDown },
  { value: 'rating', label: 'Notation étoiles', icon: Star },
  { value: 'number', label: 'Nombre', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'time', label: 'Heure', icon: Clock },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Téléphone', icon: Phone },
  { value: 'url', label: 'URL', icon: Globe },
  { value: 'file_upload', label: 'Upload fichier', icon: Upload },
  { value: 'ranking', label: 'Classement', icon: ArrowUpDown },
  { value: 'matrix', label: 'Matrice / Grille', icon: Grid3X3 },
];

const CHART_COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];

const WorkspaceQuestionnaireEditor: React.FC<Props> = ({ document: doc, onSave, onClose }) => {
  const { userId } = useCurrentUser();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [sections, setSections] = useState<QuestionnaireSection[]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Load or create questionnaire
  useEffect(() => {
    const init = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const qId = (doc.content as any)?.questionnaire_id;
        if (qId) {
          const [q, qs, secs] = await Promise.all([
            questionnaireService.getQuestionnaireById(qId),
            questionnaireService.getQuestions(qId),
            questionnaireService.getSections(qId),
          ]);
          setQuestionnaire(q);
          setQuestions(qs);
          setSections(secs);
        } else {
          const q = await questionnaireService.createQuestionnaire({
            owner_id: userId,
            title: doc.title === 'Sans titre' ? 'Nouveau questionnaire' : doc.title,
          });
          setQuestionnaire(q);
          await onSave({ ...doc, content: { questionnaire_id: q.id }, title: q.title });

          // Apply template questions if any
          const templateQuestions = (doc.content as any)?.templateQuestions;
          if (templateQuestions && Array.isArray(templateQuestions) && templateQuestions.length > 0) {
            const createdQuestions: QuestionnaireQuestion[] = [];
            for (let i = 0; i < templateQuestions.length; i++) {
              const tq = templateQuestions[i];
              const newQ = await questionnaireService.createQuestion({
                questionnaire_id: q.id,
                question_type: tq.type,
                title: tq.title || '',
                order_index: i,
                is_required: tq.required || false,
                points: tq.points || 0,
                settings: tq.settings || (tq.type === 'linear_scale' ? { min: 1, max: 5, minLabel: '', maxLabel: '' } : {}),
              });
              if (tq.options && Array.isArray(tq.options) && ['single_choice', 'multiple_choice', 'dropdown'].includes(tq.type)) {
                const opts = await Promise.all(
                  tq.options.map((label: string, idx: number) => questionnaireService.createOption({ question_id: newQ.id, label, order_index: idx }))
                );
                newQ.options = opts;
              }
              createdQuestions.push(newQ);
            }
            setQuestions(createdQuestions);
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId]);

  const saveTitle = useCallback(async (title: string) => {
    if (!questionnaire) return;
    try {
      await questionnaireService.updateQuestionnaire(questionnaire.id, { title });
      setQuestionnaire(prev => prev ? { ...prev, title } : null);
      await onSave({ ...doc, title, content: { questionnaire_id: questionnaire.id } });
    } catch { toast.error('Erreur'); }
  }, [questionnaire, doc, onSave]);

  const addQuestion = async (type: string) => {
    if (!questionnaire) return;
    try {
      const q = await questionnaireService.createQuestion({
        questionnaire_id: questionnaire.id,
        question_type: type,
        title: '',
        order_index: questions.length,
        is_required: false,
        points: 0,
        settings: type === 'linear_scale' ? { min: 1, max: 5, minLabel: '', maxLabel: '' } : {},
      });

      if (['single_choice', 'multiple_choice', 'dropdown'].includes(type)) {
        const opt1 = await questionnaireService.createOption({ question_id: q.id, label: 'Option 1', order_index: 0 });
        const opt2 = await questionnaireService.createOption({ question_id: q.id, label: 'Option 2', order_index: 1 });
        q.options = [opt1, opt2];
      }

      setQuestions(prev => [...prev, q]);
      setSelectedQuestion(q.id);
      toast.success('Question ajoutée');
    } catch { toast.error('Erreur'); }
  };

  const updateQuestion = async (id: string, updates: Partial<QuestionnaireQuestion>) => {
    try {
      await questionnaireService.updateQuestion(id, updates);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    } catch { toast.error('Erreur'); }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await questionnaireService.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (selectedQuestion === id) setSelectedQuestion(null);
      toast.success('Question supprimée');
    } catch { toast.error('Erreur'); }
  };

  const duplicateQuestion = async (q: QuestionnaireQuestion) => {
    if (!questionnaire) return;
    try {
      const newQ = await questionnaireService.createQuestion({
        questionnaire_id: questionnaire.id,
        question_type: q.question_type,
        title: q.title + ' (copie)',
        description: q.description,
        is_required: q.is_required,
        order_index: questions.length,
        points: q.points,
        settings: q.settings,
      });
      if (q.options?.length) {
        const newOpts = await Promise.all(
          q.options.map(o => questionnaireService.createOption({ question_id: newQ.id, label: o.label, order_index: o.order_index, is_correct: o.is_correct, points: o.points }))
        );
        newQ.options = newOpts;
      }
      setQuestions(prev => [...prev, newQ]);
      toast.success('Question dupliquée');
    } catch { toast.error('Erreur'); }
  };

  const addOption = async (questionId: string) => {
    try {
      const q = questions.find(q => q.id === questionId);
      const idx = q?.options?.length || 0;
      const opt = await questionnaireService.createOption({ question_id: questionId, label: `Option ${idx + 1}`, order_index: idx });
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, options: [...(q.options || []), opt] } : q));
    } catch { toast.error('Erreur'); }
  };

  const updateOption = async (optionId: string, questionId: string, updates: Partial<QuestionnaireOption>) => {
    try {
      await questionnaireService.updateOption(optionId, updates);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, options: q.options?.map(o => o.id === optionId ? { ...o, ...updates } : o) } : q));
    } catch { toast.error('Erreur'); }
  };

  const deleteOption = async (optionId: string, questionId: string) => {
    try {
      await questionnaireService.deleteOption(optionId);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, options: q.options?.filter(o => o.id !== optionId) } : q));
    } catch { toast.error('Erreur'); }
  };

  const togglePublish = async () => {
    if (!questionnaire) return;
    try {
      const updated = await questionnaireService.updateQuestionnaire(questionnaire.id, { is_published: !questionnaire.is_published });
      setQuestionnaire(updated);
      toast.success(updated.is_published ? 'Questionnaire publié !' : 'Questionnaire dépublié');
    } catch { toast.error('Erreur'); }
  };

  const loadAnalytics = async () => {
    if (!questionnaire) return;
    setLoadingAnalytics(true);
    try {
      const data = await questionnaireService.getAnalytics(questionnaire.id);
      setAnalytics(data);
    } catch { toast.error('Erreur de chargement des analyses'); }
    finally { setLoadingAnalytics(false); }
  };

  const runAIAnalysis = async () => {
    if (!questionnaire || !analytics) return;
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-questionnaire', {
        body: { questionnaireId: questionnaire.id, analytics },
      });
      if (error) throw error;
      setAiAnalysis(data?.analysis || 'Aucune analyse disponible');
    } catch (err: any) {
      toast.error('Erreur d\'analyse IA');
      console.error(err);
    } finally { setLoadingAI(false); }
  };

  useEffect(() => {
    if (activeTab === 'analytics' && questionnaire) loadAnalytics();
  }, [activeTab]);

  const getPublicUrl = () => {
    if (!questionnaire) return '';
    const base = window.location.origin;
    return `${base}/questionnaire/${questionnaire.public_token}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getPublicUrl());
    toast.success('Lien copié !');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
          <p className="text-muted-foreground">Chargement du questionnaire...</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) return null;

  const renderQuestionTypeIcon = (type: string) => {
    const qt = QUESTION_TYPES.find(t => t.value === type);
    if (!qt) return <Type className="h-4 w-4" />;
    const Icon = qt.icon;
    return <Icon className="h-4 w-4" />;
  };

  const renderQuestionEditor = (q: QuestionnaireQuestion) => {
    const isSelected = selectedQuestion === q.id;
    return (
      <Card
        key={q.id}
        className={`p-4 sm:p-5 transition-all cursor-pointer border-2 ${isSelected ? 'shadow-lg' : 'border-border hover:border-primary/30'}`}
        style={isSelected ? { borderColor: questionnaire.theme_color || 'hsl(var(--primary))', boxShadow: `0 10px 15px -3px ${questionnaire.theme_color || 'hsl(var(--primary))'}20` } : undefined}
        onClick={() => setSelectedQuestion(q.id)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="mt-1 cursor-grab text-muted-foreground">
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  {renderQuestionTypeIcon(q.question_type)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {QUESTION_TYPES.find(t => t.value === q.question_type)?.label}
                </Badge>
                {q.is_required && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                {questionnaire.scoring_enabled && q.points > 0 && (
                  <Badge className="text-xs bg-amber-500">{q.points} pts</Badge>
                )}
              </div>
              <Input
                value={q.title}
                onChange={e => updateQuestion(q.id, { title: e.target.value })}
                placeholder="Saisissez votre question..."
                className="text-base font-medium border-0 border-b-2 border-muted rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
              />
              {isSelected && (
                <Input
                  value={q.description || ''}
                  onChange={e => updateQuestion(q.id, { description: e.target.value || null })}
                  placeholder="Description (optionnel)"
                  className="text-sm text-muted-foreground border-0 border-b border-muted/50 rounded-none px-0 focus-visible:ring-0"
                />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); duplicateQuestion(q); }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Options for choice questions */}
          {['single_choice', 'multiple_choice', 'dropdown'].includes(q.question_type) && (
            <div className="pl-8 space-y-2">
              {q.options?.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  {q.question_type === 'single_choice' ? <Circle className="h-4 w-4 text-muted-foreground" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                  <Input
                    value={opt.label}
                    onChange={e => updateOption(opt.id, q.id, { label: e.target.value })}
                    className="flex-1 h-8 text-sm"
                    placeholder={`Option ${idx + 1}`}
                  />
                  {questionnaire.scoring_enabled && (
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={opt.is_correct}
                        onCheckedChange={v => updateOption(opt.id, q.id, { is_correct: v })}
                      />
                      <span className="text-xs text-muted-foreground">✓</span>
                    </div>
                  )}
                  {(q.options?.length || 0) > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteOption(opt.id, q.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => addOption(q.id)}>
                <Plus className="h-4 w-4 mr-1" /> Ajouter une option
              </Button>
            </div>
          )}

          {/* Scale settings */}
          {q.question_type === 'linear_scale' && isSelected && (
            <div className="pl-8 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Min</Label>
                <Input type="number" value={q.settings?.min || 1} onChange={e => updateQuestion(q.id, { settings: { ...q.settings, min: parseInt(e.target.value) } })} className="w-16 h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Max</Label>
                <Input type="number" value={q.settings?.max || 5} onChange={e => updateQuestion(q.id, { settings: { ...q.settings, max: parseInt(e.target.value) } })} className="w-16 h-8 text-sm" />
              </div>
            </div>
          )}

          {/* Rating preview */}
          {q.question_type === 'rating' && (
            <div className="pl-8 flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-200" />
              ))}
            </div>
          )}

          {/* Question settings */}
          {isSelected && (
            <div className="pl-8 pt-2 border-t border-border/50">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={q.is_required} onCheckedChange={v => updateQuestion(q.id, { is_required: v })} />
                  <Label className="text-sm">Obligatoire</Label>
                </div>
                {questionnaire.scoring_enabled && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Points</Label>
                    <Input type="number" value={q.points} onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 0 })} className="w-20 h-8 text-sm" />
                  </div>
                )}
                <Select value={q.question_type} onValueChange={v => updateQuestion(q.id, { question_type: v })}>
                  <SelectTrigger className="w-48 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Conditional logic */}
                {questions.indexOf(q) > 0 && (
                  <Select
                    value={q.condition_question_id || 'none'}
                    onValueChange={v => updateQuestion(q.id, { condition_question_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="w-56 h-8 text-sm">
                      <SelectValue placeholder="Logique conditionnelle..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Toujours afficher</SelectItem>
                      {questions.filter(pq => pq.id !== q.id && questions.indexOf(pq) < questions.indexOf(q)).map(pq => (
                        <SelectItem key={pq.id} value={pq.id}>Si "{pq.title.slice(0, 30)}..."</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {q.condition_question_id && (
                  <Input
                    value={q.condition_value || ''}
                    onChange={e => updateQuestion(q.id, { condition_value: e.target.value, condition_operator: 'equals' })}
                    placeholder="= valeur attendue"
                    className="w-40 h-8 text-sm"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderAnalyticsTab = () => {
    if (loadingAnalytics) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (!analytics) return null;

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{analytics.totalResponses}</p>
            <p className="text-xs text-muted-foreground">Réponses totales</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{analytics.completionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Taux de complétion</p>
          </Card>
          <Card className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{questions.length}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </Card>
          {analytics.avgScore !== null && (
            <Card className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{analytics.avgScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </Card>
          )}
        </div>

        {/* AI Analysis */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Analyse IA</h3>
            </div>
            <Button onClick={runAIAnalysis} disabled={loadingAI || analytics.totalResponses === 0} size="sm" className="gap-1.5">
              {loadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loadingAI ? 'Analyse en cours...' : 'Lancer l\'analyse IA'}
            </Button>
          </div>
          {analytics.totalResponses === 0 && (
            <p className="text-muted-foreground text-sm">Aucune réponse à analyser pour le moment.</p>
          )}
          {aiAnalysis && (
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
              {aiAnalysis}
            </div>
          )}
        </Card>

        {/* Per-question analytics */}
        {analytics.questionAnalytics.map((qa: any, idx: number) => (
          <Card key={qa.question.id} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">{idx + 1}</Badge>
              <h4 className="font-medium">{qa.question.title || 'Question sans titre'}</h4>
              <Badge variant="secondary">{qa.totalAnswers} réponses</Badge>
            </div>

            {qa.type === 'choice' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(qa.data).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={Object.entries(qa.data).map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                      >
                        {Object.entries(qa.data).map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {qa.type === 'numeric' && (
              <div className="space-y-3">
                <div className="flex gap-4 text-sm">
                  <span>Moyenne: <strong>{qa.data.avg.toFixed(1)}</strong></span>
                  <span>Min: <strong>{qa.data.min}</strong></span>
                  <span>Max: <strong>{qa.data.max}</strong></span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(qa.data.distribution).map(([name, value]) => ({ name, value })).sort((a, b) => parseFloat(a.name) - parseFloat(b.name))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {qa.type === 'text' && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(qa.data as string[]).slice(0, 20).map((text: string, i: number) => (
                  <div key={i} className="p-2 bg-muted/30 rounded-lg text-sm">{text}</div>
                ))}
                {(qa.data as string[]).length > 20 && (
                  <p className="text-xs text-muted-foreground">...et {(qa.data as string[]).length - 20} autres réponses</p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-2">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Input
              value={questionnaire.title}
              onChange={e => setQuestionnaire(prev => prev ? { ...prev, title: e.target.value } : null)}
              onBlur={e => saveTitle(e.target.value)}
              className="text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 w-64 sm:w-96"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={questionnaire.is_published ? 'default' : 'secondary'}>
              {questionnaire.is_published ? 'Publié' : 'Brouillon'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)} className="gap-1.5">
              <Share2 className="h-4 w-4" /> Partager
            </Button>
            <Button size="sm" onClick={togglePublish} className="gap-1.5">
              {questionnaire.is_published ? 'Dépublier' : 'Publier'}
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto w-full px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="editor" className="gap-1.5">
              <FileText className="h-4 w-4" /> Éditeur
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Analyse
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" /> Paramètres
            </TabsTrigger>
          </TabsList>

          {/* ============ EDITOR TAB ============ */}
          <TabsContent value="editor" className="mt-4 pb-24">
            <div className="space-y-4">
              {/* Description */}
              <Card className="p-5 border-t-4" style={{ borderTopColor: questionnaire.theme_color || 'hsl(var(--primary))' }}>
                <Textarea
                  value={questionnaire.description || ''}
                  onChange={e => {
                    setQuestionnaire(prev => prev ? { ...prev, description: e.target.value } : null);
                  }}
                  onBlur={() => {
                    if (questionnaire) questionnaireService.updateQuestionnaire(questionnaire.id, { description: questionnaire.description });
                  }}
                  placeholder="Description du questionnaire (optionnel)..."
                  className="border-0 resize-none focus-visible:ring-0 text-sm"
                  rows={2}
                />
              </Card>

              {/* Questions */}
              {questions.map(q => renderQuestionEditor(q))}

              {/* Add question */}
              <Card className="p-4 border-dashed border-2" style={{ borderColor: (questionnaire.theme_color || 'hsl(var(--primary))') + '50' }}>
                <p className="text-sm font-medium text-primary mb-3 text-center">Ajouter une question</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {QUESTION_TYPES.slice(0, 8).map(t => (
                    <button
                      key={t.value}
                      onClick={() => addQuestion(t.value)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/5 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <t.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary text-center leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-2">
                  {QUESTION_TYPES.slice(8).map(t => (
                    <button
                      key={t.value}
                      onClick={() => addQuestion(t.value)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/5 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <t.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary text-center leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ============ ANALYTICS TAB ============ */}
          <TabsContent value="analytics" className="mt-4 pb-24">
            {renderAnalyticsTab()}
          </TabsContent>

          {/* ============ SETTINGS TAB ============ */}
          <TabsContent value="settings" className="mt-4 pb-24">
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">Paramètres du questionnaire</h3>
              <Separator />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Scoring / Quiz</Label>
                    <p className="text-xs text-muted-foreground">Attribuer des points aux réponses correctes</p>
                  </div>
                  <Switch
                    checked={questionnaire.scoring_enabled}
                    onCheckedChange={v => {
                      setQuestionnaire(prev => prev ? { ...prev, scoring_enabled: v } : null);
                      questionnaireService.updateQuestionnaire(questionnaire.id, { scoring_enabled: v })
                        .then(() => toast.success('Paramètre mis à jour'));
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Authentification requise</Label>
                    <p className="text-xs text-muted-foreground">Les répondants doivent être connectés</p>
                  </div>
                  <Switch
                    checked={questionnaire.requires_auth}
                    onCheckedChange={v => {
                      setQuestionnaire(prev => prev ? { ...prev, requires_auth: v } : null);
                      questionnaireService.updateQuestionnaire(questionnaire.id, { requires_auth: v })
                        .then(() => toast.success('Paramètre mis à jour'));
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Réponses multiples</Label>
                    <p className="text-xs text-muted-foreground">Permettre à un utilisateur de répondre plusieurs fois</p>
                  </div>
                  <Switch
                    checked={questionnaire.allow_multiple_responses}
                    onCheckedChange={v => {
                      setQuestionnaire(prev => prev ? { ...prev, allow_multiple_responses: v } : null);
                      questionnaireService.updateQuestionnaire(questionnaire.id, { allow_multiple_responses: v })
                        .then(() => toast.success('Paramètre mis à jour'));
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Mélanger les questions</Label>
                    <p className="text-xs text-muted-foreground">Afficher les questions dans un ordre aléatoire</p>
                  </div>
                  <Switch
                    checked={questionnaire.shuffle_questions}
                    onCheckedChange={v => {
                      setQuestionnaire(prev => prev ? { ...prev, shuffle_questions: v } : null);
                      questionnaireService.updateQuestionnaire(questionnaire.id, { shuffle_questions: v })
                        .then(() => toast.success('Paramètre mis à jour'));
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Barre de progression</Label>
                    <p className="text-xs text-muted-foreground">Afficher la progression du répondant</p>
                  </div>
                  <Switch
                    checked={questionnaire.show_progress_bar}
                    onCheckedChange={v => {
                      setQuestionnaire(prev => prev ? { ...prev, show_progress_bar: v } : null);
                      questionnaireService.updateQuestionnaire(questionnaire.id, { show_progress_bar: v })
                        .then(() => toast.success('Paramètre mis à jour'));
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Accepter les réponses</Label>
                    <p className="text-xs text-muted-foreground">Activer/désactiver la collecte de réponses</p>
                  </div>
                  <Switch
                    checked={questionnaire.is_accepting_responses}
                    onCheckedChange={v => {
                      setQuestionnaire(prev => prev ? { ...prev, is_accepting_responses: v } : null);
                      questionnaireService.updateQuestionnaire(questionnaire.id, { is_accepting_responses: v })
                        .then(() => toast.success('Paramètre mis à jour'));
                    }}
                  />
                </div>

                <div>
                  <Label className="font-medium">Message de confirmation</Label>
                  <Textarea
                    value={questionnaire.confirmation_message}
                    onChange={e => setQuestionnaire(prev => prev ? { ...prev, confirmation_message: e.target.value } : null)}
                    onBlur={() => questionnaireService.updateQuestionnaire(questionnaire.id, { confirmation_message: questionnaire.confirmation_message })}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="font-medium">Couleur du thème</Label>
                  <div className="flex gap-2 mt-2">
                    {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'].map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          setQuestionnaire(prev => prev ? { ...prev, theme_color: c } : null);
                          questionnaireService.updateQuestionnaire(questionnaire.id, { theme_color: c })
                            .then(() => toast.success('Couleur du thème mise à jour'));
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${questionnaire.theme_color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Share modal: Public link */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" /> Partager le questionnaire
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="flex-1 gap-1.5">
                <Link2 className="h-4 w-4" /> Lien public
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => {
                  setShowShareModal(false);
                  setTimeout(() => setShowCollaboratorsModal(true), 150);
                }}
              >
                <Users className="h-4 w-4" /> Collaborateurs
              </Button>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Lien d'accès direct (sans connexion)</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">Toute personne possédant ce lien peut répondre au questionnaire, comme un Google Form.</p>
              <div className="flex gap-2">
                <Input value={getPublicUrl()} readOnly className="text-sm font-mono" />
                <Button size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
                  <Link2 className="h-4 w-4" /> Copier
                </Button>
              </div>
            </div>
            {!questionnaire.is_published && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <ToggleLeft className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-400">Le questionnaire doit être publié pour que le lien soit accessible.</p>
              </div>
            )}
            <Button onClick={() => window.open(getPublicUrl(), '_blank')} variant="outline" className="w-full gap-1.5" disabled={!questionnaire.is_published}>
              <ExternalLink className="h-4 w-4" /> Aperçu public
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collaborators modal (ShareDocumentModal) */}
      {userId && (
        <ShareDocumentModal
          open={showCollaboratorsModal}
          onOpenChange={(open) => {
            setShowCollaboratorsModal(open);
            if (!open) {
              // Optionally go back to share modal
            }
          }}
          documentId={doc.id}
          userId={userId}
        />
      )}
    </div>
  );
};

export default WorkspaceQuestionnaireEditor;
