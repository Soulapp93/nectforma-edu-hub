import React, { useState } from 'react';
import { Eye, Check, X, Maximize2, Minimize2, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarouselPreview, TikTokScriptPreview, TikTokScenePlayer, ThreadPreview } from './SocialPreviews';

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

const ContentDetailModal = ({ post, isOpen, onClose, onApprove, onReject }: {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  if (!post) return null;

  const slides = (() => {
    if (post.structured_content?.slides) return post.structured_content.slides;
    if (post.structured_content?.carousel?.slides) return post.structured_content.carousel.slides;
    return null;
  })();

  const videoScript = post.video_script || post.structured_content?.video_script || null;
  const tweets = (() => {
    if (!post.thread_tweets) return null;
    if (Array.isArray(post.thread_tweets)) return post.thread_tweets as string[];
    return null;
  })();

  const platformLabels: Record<string, string> = {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'X (Twitter)',
  };

  const platformIcons: Record<string, React.ReactNode> = {
    linkedin: <Linkedin className="h-5 w-5" />,
    instagram: <Instagram className="h-5 w-5" />,
    tiktok: <Music2 className="h-5 w-5" />,
    twitter: <Twitter className="h-5 w-5" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {platformIcons[post.platform]}
            </div>
            <div>
              <h2 className="font-bold text-lg">{platformLabels[post.platform] || post.platform}</h2>
              <p className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.approval_status === 'approved' && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</Badge>
            )}
            {post.approval_status === 'rejected' && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>
            )}
            {post.approval_status === 'pending' && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Visual preview */}
          {slides && slides.length > 0 && (
            <CarouselPreview slides={slides} platform={post.platform} fullscreen />
          )}

          {post.platform === 'tiktok' && (
            <>
              {(post.media_urls && post.media_urls.length > 0) || videoScript ? (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Video className="h-4 w-4" /> {post.media_urls && post.media_urls.length > 0 ? 'Vidéo / Scènes générées' : 'Script vidéo'}
                  </h3>
                  <TikTokScenePlayer mediaUrls={post.media_urls} script={videoScript} fullscreen />
                </div>
              ) : null}
              {videoScript && !(post.media_urls && post.media_urls.length > 0) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Play className="h-4 w-4" /> Script vidéo
                  </h3>
                  <TikTokScriptPreview script={videoScript} fullscreen />
                </div>
              )}
            </>
          )}

          {tweets && post.platform === 'twitter' && (
            <ThreadPreview tweets={tweets} fullscreen />
          )}

          {/* Caption */}
          {post.caption && (
            <div className="bg-muted/50 rounded-xl p-5">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Caption</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.caption}</p>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <Hash className="h-3 w-3 mr-0.5" />{tag.replace('#', '')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {post.approval_status === 'pending' && (
          <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => { onReject(post.id); onClose(); }}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { onApprove(post.id); onClose(); }}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Approuver
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Gallery Component ───

export { ContentDetailModal };
