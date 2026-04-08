import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, 
  FileText, TrendingUp, BarChart3, Calendar, Clock,
  Globe, Folder, Bot, Home, Cpu,
  Zap, LogIn, LogOut, Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import {
  getAllPosts, getCategories, getTags, createPost, updatePost, deletePost,
  publishPost, unpublishPost, createCategory, deleteCategory, createTag, deleteTag,
  setPostTags, getBlogStats, BlogPost, BlogCategory, BlogTag, BlogStats
} from '@/services/blogService';
import { BlogCalendarView } from '@/components/blog-admin/BlogCalendarView';
import { MonthlyArticleGenerator } from '@/components/blog-admin/MonthlyArticleGenerator';
import { AIAutopilotPanel } from '@/components/blog-admin/AIAutopilotPanel';
import { SocialContentGallery } from '@/components/blog-admin/SocialContentGallery';
import { StatCard } from '@/components/blog-admin/StatCard';
import { AIPostEditor } from '@/components/blog-admin/AIPostEditor';
import { SEOTab } from '@/components/blog-admin/SEOTab';
import logoNf from '@/assets/logo-nf.png';


// ============================================
// MAIN BLOG ADMIN
// ============================================

const BlogAdmin = () => {
  const navigate = useNavigate();
  const { canManageBlog, canViewAnalytics, loading: authLoading } = useSuperAdmin();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null | 'new'>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  // Track auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/blog-admin');
  };

  useEffect(() => {
    if (!authLoading && !canManageBlog) {
      navigate('/');
    }
  }, [authLoading, canManageBlog, navigate]);

  useEffect(() => {
    if (canManageBlog) loadData();
  }, [canManageBlog]);

  // Check for scheduled posts that should be published
  useEffect(() => {
    const checkScheduled = async () => {
      const now = new Date().toISOString();
      const toPublish = posts.filter(p => 
        p.status === 'scheduled' && p.scheduled_for && p.scheduled_for <= now
      );
      for (const post of toPublish) {
        try {
          await publishPost(post.id);
        } catch (e) {
          console.error(`Failed to auto-publish: ${post.title}`, e);
        }
      }
      if (toPublish.length > 0) {
        toast.success(`${toPublish.length} article(s) publié(s) automatiquement`);
        await loadData();
      }
    };

    if (posts.length > 0) checkScheduled();
    const interval = setInterval(checkScheduled, 60000);
    return () => clearInterval(interval);
  }, [posts]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, categoriesData, tagsData, statsData] = await Promise.all([
        getAllPosts(), getCategories(), getTags(), getBlogStats()
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
      setTags(tagsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (data: Partial<BlogPost>, tagIds: string[]): Promise<string | void> => {
    if (editingPost === 'new') {
      const existingId = data.id;
      if (existingId) {
        await updatePost(existingId, data);
        await setPostTags(existingId, tagIds);
        await loadData();
        return existingId;
      }
      const newPost = await createPost(data);
      if (tagIds.length > 0) await setPostTags(newPost.id, tagIds);
      await loadData();
      return newPost.id;
    } else if (editingPost) {
      await updatePost(editingPost.id, data);
      await setPostTags(editingPost.id, tagIds);
      await loadData();
      return editingPost.id;
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await deletePost(id);
      toast.success('Article supprimé');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.status === 'published') {
        await unpublishPost(post.id);
        toast.success('Article dépublié');
      } else {
        await publishPost(post.id);
        toast.success('Article publié');
      }
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleSchedulePost = async (postId: string, dateStr: string) => {
    const scheduledDate = new Date(dateStr).toISOString();
    await updatePost(postId, { status: 'scheduled', scheduled_for: scheduledDate });
    await loadData();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory({
        name: newCategoryName,
        slug: newCategoryName.toLowerCase().replace(/\s+/g, '-')
      });
      setNewCategoryName('');
      setShowCategoryDialog(false);
      toast.success('Catégorie créée');
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allKeywords: Record<string, number> = {};
  posts.forEach(p => {
    (p.seo_keywords || []).forEach(kw => {
      const k = kw.toLowerCase().trim();
      if (k) allKeywords[k] = (allKeywords[k] || 0) + 1;
    });
  });
  const topKeyword = Object.entries(allKeywords).sort(([,a],[,b]) => b - a)[0];

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  if (authLoading || (canManageBlog && loading)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!canManageBlog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <img src={logoNf} alt="Nectforma" className="h-10 mx-auto" />
          <h1 className="text-xl font-semibold">Accès refusé</h1>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas les droits nécessaires pour accéder à l'administration du blog.
          </p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-500 text-white">Publié</Badge>;
      case 'draft': return <Badge variant="secondary">Brouillon</Badge>;
      case 'scheduled': return <Badge className="bg-blue-500 text-white">Programmé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoNf} alt="Nectforma" className="h-7" />
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                Blog Admin
                <Badge variant="outline" className="text-[10px] h-5">
                  <Sparkles className="h-3 w-3 mr-0.5" />
                  IA
                </Badge>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.open('/blog', '_blank')}>
              <Eye className="h-4 w-4 mr-1.5" />
              Blog
            </Button>
            <Button size="sm" onClick={() => setEditingPost('new')}>
              <Plus className="h-4 w-4 mr-1.5" />
              Créer un article
            </Button>
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Déconnexion
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-1.5" />
                Connexion
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard title="Total articles" value={stats.totalPosts} icon={FileText} />
            <StatCard title="Publiés" value={stats.publishedPosts} icon={Send} />
            <StatCard title="Programmés" value={scheduledCount} icon={CalendarCheck} accent={scheduledCount > 0} />
            <StatCard title="Vues totales" value={stats.totalViews.toLocaleString()} icon={TrendingUp} />
            <StatCard 
              title="Top mot-clé" 
              value={topKeyword ? topKeyword[0] : '—'} 
              icon={KeyRound}
              trend={topKeyword ? `${topKeyword[1]} article(s)` : undefined}
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="bg-background border h-auto p-1 flex-wrap">
            <TabsTrigger value="posts" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Planificateur
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5">
              <Target className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="autopilot" className="gap-1.5">
              <Cpu className="h-4 w-4" />
              Autopilot IA
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5">
              <Share2 className="h-4 w-4" />
              Contenus sociaux
            </TabsTrigger>
            {canViewAnalytics && (
              <TabsTrigger value="analytics" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="published">Publiés</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                      <SelectItem value="scheduled">Programmés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Vues</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun article trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPosts.map(post => (
                        <TableRow key={post.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEditingPost(post)}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-[11px] text-muted-foreground">/blog/{post.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{post.category?.name || '—'}</TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell className="text-sm">{post.views_count}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {post.scheduled_for
                                ? <span className="text-blue-600 dark:text-blue-400">{format(new Date(post.scheduled_for), 'd MMM yyyy HH:mm', { locale: fr })}</span>
                                : post.published_at 
                                  ? format(new Date(post.published_at), 'd MMM yyyy', { locale: fr })
                                  : format(new Date(post.created_at), 'd MMM yyyy', { locale: fr })
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingPost(post); }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`/blog/${post.slug}`, '_blank'); }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePublish(post); }}>
                                  {post.status === 'published' ? (
                                    <><Clock className="h-4 w-4 mr-2" />Dépublier</>
                                  ) : (
                                    <><Send className="h-4 w-4 mr-2" />Publier</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduler Tab — Calendar + Monthly Generator */}
          <TabsContent value="scheduler">
            <div className="space-y-6">
              <MonthlyArticleGenerator 
                categories={categories} 
                onComplete={loadData} 
              />
              <BlogCalendarView
                posts={posts}
                onEditPost={(post) => setEditingPost(post)}
                onSchedulePost={handleSchedulePost}
              />
            </div>
          </TabsContent>


          {/* SEO Tab */}
          <TabsContent value="seo">
            <SEOTab posts={posts} />
          </TabsContent>

          {/* Autopilot Tab */}
          <TabsContent value="autopilot">
            <AIAutopilotPanel onContentGenerated={loadData} />
          </TabsContent>

          {/* Social Content Gallery Tab */}
          <TabsContent value="social">
            <SocialContentGallery />
          </TabsContent>

          {/* Analytics Tab */}
          {canViewAnalytics && (
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques du Blog</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-4">Articles les plus vus</h3>
                        <div className="space-y-2">
                          {stats.topPosts.map((post, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span>{post.title}</span>
                              <Badge variant="outline">{post.views} vues</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-4">Vues par jour (30 derniers jours)</h3>
                        <div className="h-40 flex items-end gap-1">
                          {stats.viewsByDay.slice(-30).map((day, i) => (
                            <div 
                              key={i}
                              className="flex-1 bg-primary rounded-t min-h-[4px]"
                              style={{ 
                                height: `${Math.max(4, (day.views / Math.max(...stats.viewsByDay.map(d => d.views), 1) * 100))}%` 
                              }}
                              title={`${day.date}: ${day.views} vues`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* AI Post Editor */}
      {editingPost && (
        <AIPostEditor
          post={editingPost === 'new' ? null : editingPost}
          categories={categories}
          tags={tags}
          onSave={handleSavePost}
          onClose={() => setEditingPost(null)}
        />
      )}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Tutoriels"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateCategory}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogAdmin;
