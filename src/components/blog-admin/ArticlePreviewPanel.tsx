import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogPost, BlogCategory } from '@/services/blogService';

interface ArticlePreviewPanelProps {
  formData: Partial<BlogPost>;
  category?: BlogCategory;
}

export const ArticlePreviewPanel = ({ formData, category }: ArticlePreviewPanelProps) => {
  const [previewMode, setPreviewMode] = useState<'card' | 'article'>('card');

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button
          variant={previewMode === 'card' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMode('card')}
          className="text-xs"
        >
          Carte
        </Button>
        <Button
          variant={previewMode === 'article' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMode('article')}
          className="text-xs"
        >
          Article complet
        </Button>
      </div>

      {previewMode === 'card' ? (
        <>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Aperçu page d'accueil</h3>
          <div className="bg-card rounded-2xl border-2 border-primary/20 overflow-hidden shadow-sm">
            <div className="flex flex-col">
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                {formData.cover_image_url ? (
                  <img src={formData.cover_image_url} alt={formData.title || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {category && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{category.name}</span>}
                  <span className="text-[10px] text-muted-foreground">• {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</span>
                </div>
                <h4 className="font-semibold text-sm leading-snug mb-2 line-clamp-2">{formData.title || "Titre de l'article"}</h4>
                {formData.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{formData.excerpt}</p>}
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2">
                  <ArrowRight className="h-3 w-3" /> Lire l'article
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Aperçu article</h3>
          <div className="bg-background rounded-xl border-2 border-primary/20 overflow-hidden shadow-sm max-h-[70vh] overflow-y-auto">
            <div className="aspect-[16/7] bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
              {formData.cover_image_url ? (
                <img src={formData.cover_image_url} alt={formData.title || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-primary/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <h2 className="text-white font-bold text-sm leading-snug">{formData.title || "Titre de l'article"}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-white/80 text-[10px]">Équipe Nectforma</span>
                    <span className="text-white/60 text-[10px]">• {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div
                className="prose prose-sm max-w-none dark:prose-invert
                  prose-h2:text-primary prose-h2:text-base prose-h2:border-l-4 prose-h2:border-primary prose-h2:pl-3 prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-primary/80 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-xs prose-p:leading-relaxed prose-p:mb-3
                  [&_.highlight-box]:bg-primary/5 [&_.highlight-box]:border-l-4 [&_.highlight-box]:border-primary [&_.highlight-box]:rounded-r-lg [&_.highlight-box]:p-3 [&_.highlight-box]:my-4 [&_.highlight-box]:text-xs
                  [&_.stat-box]:bg-primary/5 [&_.stat-box]:rounded-xl [&_.stat-box]:p-3 [&_.stat-box]:my-4 [&_.stat-box]:text-center [&_.stat-box]:text-xs
                  [&_.stat-number]:text-lg [&_.stat-number]:font-bold [&_.stat-number]:text-primary [&_.stat-number]:block
                  [&_.info-box]:bg-blue-50 [&_.info-box]:rounded-lg [&_.info-box]:p-3 [&_.info-box]:my-4 [&_.info-box]:text-xs
                  [&_.warning-box]:bg-amber-50 [&_.warning-box]:rounded-lg [&_.warning-box]:p-3 [&_.warning-box]:my-4 [&_.warning-box]:text-xs
                  [&_.article-cta]:bg-primary [&_.article-cta]:text-white [&_.article-cta]:rounded-xl [&_.article-cta]:p-4 [&_.article-cta]:my-4 [&_.article-cta]:text-center [&_.article-cta]:text-xs
                  [&_.schema-box]:border [&_.schema-box]:rounded-xl [&_.schema-box]:p-3 [&_.schema-box]:my-4 [&_.schema-box]:text-xs"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content || '<p class="text-muted-foreground">Aucun contenu</p>') }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
