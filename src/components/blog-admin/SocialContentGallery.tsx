import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, Check, X, Clock, RefreshCw, Filter, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarouselPreview, TikTokScriptPreview, TikTokScenePlayer, ThreadPreview } from './SocialPreviews';
import { ContentDetailModal } from './ContentDetailModal';

interface SocialPost {
  id: string;
  platform: string;
  caption: string;
  hashtags: string[];
  content_type: string;
  structured_content: any;
  slide_count: number;
  video_script: string | null;
  thread_tweets: any;
  status: string;
  approval_status: string;
  ai_generated: boolean;
  created_at: string;
  blog_post_id: string | null;
  media_urls: string[] | null;
}

// ─── Carousel Slide Preview (visual, like Canva) ───

export const SocialContentGallery = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [linkedinConnected, setLinkedinConnected] = useState<boolean | null>(null);
  const [connectingLinkedin, setConnectingLinkedin] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState<SocialPost | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);

  // Check LinkedIn connection status
  useEffect(() => {
    const checkLinkedin = async () => {
      const { data } = await supabase
        .from('social_media_connections')
        .select('connection_status')
        .eq('platform', 'linkedin' as any)
        .eq('connection_status', 'connected')
        .maybeSingle();
      setLinkedinConnected(!!data);
    };
    checkLinkedin();
  }, []);

  const handleConnectLinkedin = async () => {
    setConnectingLinkedin(true);
    try {
      // Always use production domain for LinkedIn OAuth redirect
      const redirectUri = 'https://nectforma.com/linkedin-callback';
      const { data, error } = await supabase.functions.invoke('linkedin-oauth', {
        body: { action: 'get-auth-url', redirect_uri: redirectUri },
      });
      if (error || !data?.success) throw new Error(data?.error || 'Failed to get auth URL');
      // Use window.open for iframe compatibility (preview), fallback to location.href
      const opened = window.open(data.auth_url, '_blank');
      if (!opened) {
        window.location.href = data.auth_url;
      }
    } catch (err: any) {
      console.error('LinkedIn connect error:', err);
      toast.error('Erreur lors de la connexion LinkedIn');
      setConnectingLinkedin(false);
    }
  };

  const handlePublishToNetworks = async () => {
    if (!showPublishDialog || selectedNetworks.length === 0) return;
    setPublishingPostId(showPublishDialog.id);
    
    let successCount = 0;
    for (const network of selectedNetworks) {
      try {
        if (network === 'linkedin') {
          const { data, error } = await supabase.functions.invoke('linkedin-oauth', {
            body: { action: 'publish', post_id: showPublishDialog.id },
          });
          if (error || !data?.success) throw new Error(data?.error || 'Publication failed');
          successCount++;
        } else {
          // Other networks - mark as published for now
          toast.info(`Publication sur ${network} : bientôt disponible`);
        }
      } catch (err: any) {
        console.error(`Publish to ${network} error:`, err);
        toast.error(`Erreur publication ${network}: ${err.message}`);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Publié sur ${successCount} réseau(x) ! 🎉`);
      await loadPosts();
    }
    
    setPublishingPostId(null);
    setShowPublishDialog(null);
    setSelectedNetworks([]);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts((data || []) as SocialPost[]);
    } catch (e) {
      console.error('Error loading social posts:', e);
      toast.error('Erreur de chargement des contenus sociaux');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [platformFilter, statusFilter]);

  const handleApproval = async (postId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({ 
          approval_status: approved ? 'approved' : 'rejected',
          ...(approved ? { approved_at: new Date().toISOString() } : {})
        })
        .eq('id', postId);
      if (error) throw error;
      toast.success(approved ? 'Contenu approuvé ✅' : 'Contenu rejeté');
      await loadPosts();
    } catch (e) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'tiktok': return <Music2 className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn';
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'TikTok';
      case 'twitter': return 'X (Twitter)';
      default: return platform;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'bg-[#0077B5]/10 text-[#0077B5] border-[#0077B5]/20';
      case 'instagram': return 'bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20';
      case 'tiktok': return 'bg-black/10 text-foreground border-black/20';
      case 'twitter': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      default: return '';
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LinkedIn Connection Banner */}
      {linkedinConnected === false && (
        <Card className="border-[#0077B5]/30 bg-[#0077B5]/5">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#0077B5]/10 flex items-center justify-center">
                <Linkedin className="h-5 w-5 text-[#0077B5]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Connecter LinkedIn</p>
                <p className="text-xs text-muted-foreground">
                  Autorisez l'accès à votre page Nectforma pour publier automatiquement vos contenus.
                </p>
              </div>
            </div>
            <Button
              onClick={handleConnectLinkedin}
              disabled={connectingLinkedin}
              className="bg-[#0077B5] hover:bg-[#005885] text-white shrink-0"
            >
              {connectingLinkedin ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Connecter
            </Button>
          </CardContent>
        </Card>
      )}

      {linkedinConnected === true && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">LinkedIn connecté ✓</p>
              <p className="text-xs text-muted-foreground">Vous pouvez publier vos contenus approuvés sur LinkedIn.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Plateforme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les plateformes</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="twitter">X (Twitter)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadPosts}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Actualiser
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {posts.length} contenu(s)
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Aucun contenu social</h3>
            <p className="text-sm text-muted-foreground">
              Lancez l'Autopilot IA pour générer automatiquement des contenus pour vos réseaux sociaux.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map(post => (
            <Card 
              key={post.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
              onClick={() => setSelectedPost(post)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`gap-1.5 ${getPlatformColor(post.platform)}`}>
                    {getPlatformIcon(post.platform)}
                    {getPlatformLabel(post.platform)}
                  </Badge>
                  {getApprovalBadge(post.approval_status)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(post.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Caption preview */}
                {post.caption && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Caption</p>
                    <p className="text-sm line-clamp-3 whitespace-pre-wrap">{post.caption}</p>
                  </div>
                )}

                {/* Content type indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {post.content_type === 'carousel' && <><ImageIcon className="h-3.5 w-3.5" /> Carrousel ({post.slide_count || '?'} slides)</>}
                  {post.content_type === 'video_script' && <><Video className="h-3.5 w-3.5" /> Script vidéo</>}
                  {post.content_type === 'thread' && <><Twitter className="h-3.5 w-3.5" /> Thread</>}
                  {post.content_type === 'text' && <><Hash className="h-3.5 w-3.5" /> Texte</>}
                </div>

                {/* View button */}
                <div className="flex items-center justify-center pt-1">
                  <Button variant="outline" size="sm" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Eye className="h-4 w-4" />
                    Visualiser le contenu
                  </Button>
                </div>

                {/* Approval actions */}
                {post.approval_status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleApproval(post.id, false)}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1.5" />
                      Rejeter
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproval(post.id, true)}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1.5" />
                      Approuver
                    </Button>
                  </div>
                )}

                {/* Publish button for approved posts */}
                {post.approval_status === 'approved' && post.status !== 'published' && (
                  <div className="pt-2 border-t" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        setShowPublishDialog(post);
                        setSelectedNetworks([post.platform]);
                      }}
                      disabled={publishingPostId === post.id}
                    >
                      {publishingPostId === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Publier sur les réseaux
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <ContentDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onApprove={(id) => handleApproval(id, true)}
        onReject={(id) => handleApproval(id, false)}
      />

      {/* Publish to Networks Dialog */}
      <Dialog open={!!showPublishDialog} onOpenChange={() => { setShowPublishDialog(null); setSelectedNetworks([]); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Publier sur les réseaux sociaux
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez les réseaux sur lesquels publier ce contenu :
            </p>
            <div className="space-y-3">
              {[
                { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="h-4 w-4" />, connected: linkedinConnected },
                { id: 'twitter', label: 'X (Twitter)', icon: <Twitter className="h-4 w-4" />, connected: false },
                { id: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" />, connected: false },
                { id: 'tiktok', label: 'TikTok', icon: <Music2 className="h-4 w-4" />, connected: false },
              ].map(network => (
                <div 
                  key={network.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedNetworks.includes(network.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  } ${!network.connected ? 'opacity-50' : ''}`}
                  onClick={() => {
                    if (!network.connected) {
                      toast.info(`${network.label} n'est pas encore connecté`);
                      return;
                    }
                    setSelectedNetworks(prev => 
                      prev.includes(network.id) 
                        ? prev.filter(n => n !== network.id) 
                        : [...prev, network.id]
                    );
                  }}
                >
                  <Checkbox 
                    checked={selectedNetworks.includes(network.id)} 
                    disabled={!network.connected}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {network.icon}
                    <span className="text-sm font-medium">{network.label}</span>
                  </div>
                  {network.connected ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Non connecté</Badge>
                  )}
                </div>
              ))}
            </div>
            {selectedNetworks.length === 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Sélectionnez au moins un réseau connecté
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPublishDialog(null); setSelectedNetworks([]); }}>
              Annuler
            </Button>
            <Button 
              onClick={handlePublishToNetworks} 
              disabled={selectedNetworks.length === 0 || !!publishingPostId}
            >
              {publishingPostId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publier ({selectedNetworks.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
