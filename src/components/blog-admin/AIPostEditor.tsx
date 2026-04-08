import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Save, Sparkles, Target, Wand2, Eye, Calendar, Clock,
  Send, ChevronDown, Check, ArrowLeft, CalendarPlus, CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { BlogPost, BlogCategory, BlogTag } from '@/services/blogService';
import { AIGeneratedArticle } from '@/services/blogAIService';
import { AIContentGenerator } from './AIContentGenerator';
import { AISEOOptimizer } from './AISEOOptimizer';
import { AIContentEnhancer } from './AIContentEnhancer';
import { EnhancedArticleEditor } from './EnhancedArticleEditor';
import { ArticlePreviewPanel } from './ArticlePreviewPanel';

const AIPostEditor = ({ 
  post, 
  categories,
  tags,
  onSave, 
  onClose,
  initialTopic
}: { 
  post?: BlogPost | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  onSave: (data: Partial<BlogPost>, tagIds: string[]) => Promise<string | void>;
  onClose: () => void;
  initialTopic?: string;
}) => {
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    cover_image_url: post?.cover_image_url || '',
    category_id: post?.category_id || '',
    seo_title: post?.seo_title || '',
    seo_description: post?.seo_description || '',
    seo_keywords: post?.seo_keywords || [],
    status: post?.status || 'draft',
    scheduled_for: post?.scheduled_for || null
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map(t => t.id) || []
  );
  const [saving, setSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(!post);
  const [showPreview, setShowPreview] = useState(false);
  const [aiMode, setAiMode] = useState<'generate' | 'seo' | 'enhance'>('generate');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [postId, setPostId] = useState<string | null>(post?.id || null);
  const [scheduleDate, setScheduleDate] = useState(post?.scheduled_for ? post.scheduled_for.slice(0, 16) : '');

  const generateSlug = (title: string) => {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  };

  // Auto-save every 30 seconds
  const triggerAutoSave = useCallback(async () => {
    if (!formData.title?.trim()) return;
    try {
      const dataToSave = { ...formData, ...(postId ? { id: postId } : {}), status: formData.status || 'draft' as const };
      if (!postId) dataToSave.slug = generateSlug(formData.title || 'article');
      const savedId = await onSave(dataToSave, selectedTags);
      if (savedId && !postId) setPostId(savedId);
      setLastSaved(new Date());
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  }, [formData, selectedTags, onSave, postId]);

  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      if (formData.title?.trim()) triggerAutoSave();
    }, 30000);
    setAutoSaveTimer(timer);
    return () => clearTimeout(timer);
  }, [formData, selectedTags]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSave = async (publish = false, schedule = false) => {
    if (!formData.title?.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    setSaving(true);
    try {
      const slug = postId ? formData.slug : generateSlug(formData.title || 'article');
      
      let status = formData.status;
      let scheduled_for = formData.scheduled_for;
      let published_at = formData.published_at;

      if (schedule && scheduleDate) {
        status = 'scheduled';
        scheduled_for = new Date(scheduleDate).toISOString();
      } else if (publish) {
        status = 'published';
        published_at = new Date().toISOString();
        scheduled_for = null;
      }

      const dataToSave = {
        ...formData,
        ...(postId ? { id: postId } : {}),
        slug,
        status,
        published_at,
        scheduled_for
      };

      const savedId = await onSave(dataToSave, selectedTags);
      if (savedId && !postId) setPostId(savedId);
      
      if (schedule) {
        toast.success(`Article programmé pour le ${format(new Date(scheduleDate), 'd MMMM yyyy à HH:mm', { locale: fr })}`);
      } else if (publish) {
        toast.success('Article publié sur la page d\'accueil !');
      } else {
        toast.success('Brouillon enregistré');
      }
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // Import AI-generated article + auto-categorize + auto-save
  const handleAIArticleGenerated = async (article: AIGeneratedArticle) => {
    const newFormData: Partial<BlogPost> = {
      ...formData,
      title: article.title,
      slug: generateSlug(article.title),
      excerpt: article.excerpt,
      content: article.content,
      seo_title: article.seo_title,
      seo_description: article.seo_description,
      seo_keywords: article.seo_keywords
    };

    let matchingCat = categories.find(c => 
      c.name.toLowerCase().includes(article.suggested_category.toLowerCase()) ||
      article.suggested_category.toLowerCase().includes(c.name.toLowerCase())
    );
    if (matchingCat) {
      newFormData.category_id = matchingCat.id;
    } else if (categories.length > 0) {
      newFormData.category_id = categories[0].id;
    }

    setFormData(newFormData);

    const matchingTagIds = tags
      .filter(t => article.suggested_tags.some(st => 
        t.name.toLowerCase().includes(st.toLowerCase()) ||
        st.toLowerCase().includes(t.name.toLowerCase())
      ))
      .map(t => t.id);
    if (matchingTagIds.length > 0) setSelectedTags(matchingTagIds);

    setShowAIPanel(false);
    
    // Auto-generate cover image from the article's cover_image_prompt
    const coverPrompt = (article as any).cover_image_prompt || `Illustration isométrique 3D moderne pour un article sur "${article.title}", style SaaS avec palette violette et bleue`;
    try {
      const { data: imgData, error: imgError } = await supabase.functions.invoke('blog-ai', {
        body: {
          action: 'generate-image',
          data: {
            prompt: coverPrompt,
            title: article.title,
            style: 'isometric 3D illustration, modern SaaS, purple and blue palette, professional, ultra high resolution'
          }
        }
      });
      if (!imgError && imgData?.imageUrl) {
        let coverUrl = imgData.imageUrl;
        if (coverUrl && !coverUrl.startsWith('data:') && !coverUrl.startsWith('http') && coverUrl.length > 100) {
          coverUrl = `data:image/png;base64,${coverUrl}`;
        }
        if (coverUrl.startsWith('http') || coverUrl.startsWith('data:')) {
          newFormData.cover_image_url = coverUrl;
          setFormData(prev => ({ ...prev, cover_image_url: coverUrl }));
        }
      }
    } catch (coverErr) {
      console.error('Cover image generation failed:', coverErr);
    }

    try {
      const dataToSave = { ...newFormData, status: 'draft' as const };
      const savedId = await onSave(dataToSave, matchingTagIds);
      if (savedId) setPostId(savedId);
      setLastSaved(new Date());
      toast.success('Article généré et sauvegardé automatiquement !');
    } catch (e) {
      console.error('Auto-save after generation failed:', e);
      toast.info('Article importé. Pensez à l\'enregistrer.');
    }
  };

  const handleApplySEOSuggestions = (suggestions: {
    title?: string; seo_description?: string; seo_keywords?: string[];
  }) => {
    setFormData(prev => ({
      ...prev,
      ...(suggestions.title && { seo_title: suggestions.title }),
      ...(suggestions.seo_description && { seo_description: suggestions.seo_description }),
      ...(suggestions.seo_keywords && { seo_keywords: suggestions.seo_keywords })
    }));
  };

  const handleApplyContent = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    toast.success('Contenu mis à jour');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden flex">
      <div className={`flex-1 overflow-auto ${showAIPanel ? 'lg:mr-[450px]' : showPreview ? 'lg:mr-[350px]' : ''}`}>
        <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-base font-semibold">
                  {post ? 'Modifier l\'article' : 'Nouvel article'}
                </h1>
                {lastSaved && (
                  <span className="text-[11px] text-muted-foreground">
                    Sauvegardé à {format(lastSaved, 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={showPreview ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setShowPreview(!showPreview); if (!showPreview) setShowAIPanel(false); }}
              >
                <EyeIcon className="h-4 w-4 mr-1.5" />
                Aperçu
              </Button>
              <Button 
                variant={showAIPanel ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setShowAIPanel(!showAIPanel); if (!showAIPanel) setShowPreview(false); }}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                IA
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="h-4 w-4 mr-1.5" />
                Enregistrer
              </Button>
              
              {/* Schedule + Publish dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={saving} size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Send className="h-4 w-4 mr-1.5" />
                    Publier
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleSave(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Publier maintenant
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (!scheduleDate) {
                      toast.error('Définissez une date de programmation dans les paramètres');
                      return;
                    }
                    handleSave(false, true);
                  }}>
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Programmer la publication
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid lg:grid-cols-[1fr_280px] gap-8">
            <div className="space-y-6">
              <div>
                <Input
                  placeholder="Titre de l'article"
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-2xl font-bold h-auto py-3 border-0 border-b rounded-none focus-visible:ring-0 px-0"
                />
              </div>
              <div>
                <Label>Extrait</Label>
                <Textarea
                  placeholder="Un court résumé de l'article..."
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label className="mb-2 block">Contenu</Label>
                <EnhancedArticleEditor
                  content={formData.content || ''}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  title={formData.title}
                  onImageGenerated={(imageUrl) => {
                    if (!formData.cover_image_url) {
                      setFormData(prev => ({ ...prev, cover_image_url: imageUrl }));
                    }
                  }}
                />
              </div>
            </div>

            {/* Sidebar params */}
            <div className="space-y-5">
              {/* Schedule Card */}
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4 text-blue-500" />
                    Programmation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Date et heure de publication</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-1"
                    />
                  </div>
                  {scheduleDate && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(scheduleDate), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Slug URL</Label>
                    <Input
                      value={formData.slug || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="mon-article"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Image de couverture</Label>
                    <Input
                      value={formData.cover_image_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Catégorie</Label>
                    <Select 
                      value={formData.category_id || ''} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer text-[10px]"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag.id) 
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Titre SEO</Label>
                    <Input
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="Titre pour les moteurs de recherche"
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {(formData.seo_title || formData.title || '').length}/60
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Description SEO</Label>
                    <Textarea
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                      placeholder="Description pour les moteurs de recherche"
                      rows={2}
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {(formData.seo_description || formData.excerpt || '').length}/160
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Mots-clés</Label>
                    <Input
                      value={formData.seo_keywords?.join(', ') || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        seo_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                      }))}
                      placeholder="mot1, mot2, mot3"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="fixed right-0 top-0 bottom-0 w-full lg:w-[450px] bg-background border-l overflow-auto z-20">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Assistant IA</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAIPanel(false)}>×</Button>
          </div>
          <div className="p-4">
            <Tabs value={aiMode} onValueChange={(v) => setAiMode(v as typeof aiMode)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="generate">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Générer
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <Target className="h-4 w-4 mr-1" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="enhance">
                  <Wand2 className="h-4 w-4 mr-1" />
                  Améliorer
                </TabsTrigger>
              </TabsList>
              <div className="mt-4">
                <TabsContent value="generate">
                  <AIContentGenerator 
                    categories={categories}
                    onArticleGenerated={handleAIArticleGenerated}
                  />
                </TabsContent>
                <TabsContent value="seo">
                  <AISEOOptimizer
                    title={formData.title || ''}
                    content={formData.content || ''}
                    seo_description={formData.seo_description || undefined}
                    seo_keywords={formData.seo_keywords || undefined}
                    onApplySuggestions={handleApplySEOSuggestions}
                  />
                </TabsContent>
                <TabsContent value="enhance">
                  <AIContentEnhancer
                    title={formData.title || ''}
                    excerpt={formData.excerpt || ''}
                    content={formData.content || ''}
                    onApplyContent={handleApplyContent}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && (
        <div className="fixed right-0 top-0 bottom-0 w-full lg:w-[350px] bg-background border-l overflow-auto z-20">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Aperçu</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>×</Button>
          </div>
          <ArticlePreviewPanel 
            formData={formData} 
            category={categories.find(c => c.id === formData.category_id)}
          />
        </div>
      )}
    </div>
  );
};


export { AIPostEditor };
