import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, User } from 'lucide-react';
import logoNf from '@/assets/logo-nf.png';
import { supabase } from '@/integrations/supabase/client';

interface ArticleCoverImageProps {
  title: string;
  className?: string;
  size?: 'card' | 'hero';
  publishedAt?: string | null;
  readTime?: number | null;
  coverImageUrl?: string | null;
}

/**
 * Branded cover image component with AI-generated illustration.
 * Renders a consistent visual with Nectforma branding + article title overlay + contextual illustration.
 */
const ArticleCoverImage: React.FC<ArticleCoverImageProps> = ({ title, className = '', size = 'hero', publishedAt, readTime, coverImageUrl }) => {
  const isCard = size === 'card';
  const [illustrationUrl, setIllustrationUrl] = useState<string | null>(coverImageUrl || null);

  useEffect(() => {
    if (coverImageUrl) {
      setIllustrationUrl(coverImageUrl);
      return;
    }
    // Try to find cover image in storage based on a hash of the title
    const findCoverImage = async () => {
      try {
        const { data } = await supabase.storage
          .from('blog-assets')
          .list('cover-images', { limit: 100 });
        
        if (data && data.length > 0) {
          // Try to match by title slug
          const slug = title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .substring(0, 40);
          
          const match = data.find(f => f.name.includes(slug));
          if (match) {
            const { data: urlData } = supabase.storage
              .from('blog-assets')
              .getPublicUrl(`cover-images/${match.name}`);
            setIllustrationUrl(urlData.publicUrl);
          }
        }
      } catch (e) {
        // Silently fail - just use gradient background
      }
    };
    findCoverImage();
  }, [title, coverImageUrl]);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 ${className}`}>
      {/* Background illustration if available */}
      {illustrationUrl && (
        <div className="absolute inset-0">
          <img 
            src={illustrationUrl} 
            alt="" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/30 to-primary/15" />
        </div>
      )}

      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[55%] h-[80%] rounded-full bg-white/10 blur-sm" />
        <div className="absolute -bottom-[15%] -right-[8%] w-[45%] h-[70%] rounded-full bg-white/8 blur-sm" />
        <div className="absolute top-[15%] right-[20%] w-[18%] h-[28%] rounded-full bg-white/12" />
        <div className="absolute top-[10%] left-[60%] w-[30%] h-[30%] opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: isCard ? '8px 8px' : '12px 12px',
          }}
        />
        <div className="absolute bottom-[25%] left-[5%] w-[35%] h-[3px] bg-white/20 rounded-full" />
        <div className="absolute top-[60%] left-[45%] w-[6%] h-[10%] bg-white/15 rounded-lg rotate-12" />
        <div className="absolute top-[20%] left-[30%] w-[4%] h-[7%] bg-white/10 rounded-md -rotate-6" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 sm:p-6 md:p-8">
        {/* Title area — centered, hidden on card size to avoid overlap */}
        {!isCard && (
          <div className="flex-1 flex items-center justify-center text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-lg line-clamp-4 max-w-[90%]">
              {title}
            </h2>
          </div>
        )}
        {isCard && <div className="flex-1" />}

        {/* Bottom bar: metadata left + logo right */}
        <div className="flex items-end justify-between mt-3">
          {/* Author + Date + Read time */}
          {!isCard && (publishedAt || readTime) ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <User className="h-3.5 w-3.5 text-white/80" />
                <span className="text-xs sm:text-sm font-medium text-white">Équipe Nectforma</span>
              </div>
              {publishedAt && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-white/80" />
                  <span className="text-xs sm:text-sm text-white">
                    {format(new Date(publishedAt), 'd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              {readTime && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-white/80" />
                  <span className="text-xs sm:text-sm text-white">{readTime} min</span>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Logo */}
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
            <img src={logoNf} alt="Nectforma" className={isCard ? 'h-4' : 'h-5 sm:h-6'} />
            <span className={`font-semibold text-white ${isCard ? 'text-xs' : 'text-sm sm:text-base'}`}>
              Nectforma
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCoverImage;
