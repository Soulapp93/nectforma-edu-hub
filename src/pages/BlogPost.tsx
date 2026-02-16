import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Clock, Calendar, ArrowRight, Share2, User, ChevronRight, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getPostBySlug, trackPageView, trackScrollDepth, trackTimeOnPage, BlogPost as BlogPostType, getPublishedPosts } from '@/services/blogService';
import NectformaLogo from '@/components/NectformaLogo';
import ArticleCoverImage from '@/components/blog/ArticleCoverImage';
import LandingHeader from '@/components/landing/LandingHeader';
const TableOfContents = ({ content }: { content: string }) => {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const h2s = doc.querySelectorAll('h2, h3');
    const items = Array.from(h2s).map((h, i) => ({
      id: `heading-${i}`,
      text: h.textContent || '',
      level: parseInt(h.tagName[1])
    }));
    setHeadings(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="bg-card rounded-2xl border border-primary/15 p-5">
      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Sommaire</h4>
      <ul className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'pl-3' : ''}>
            <a
              href={`#${heading.id}`}
              className={`block py-1.5 text-sm border-l-2 pl-3 transition-colors leading-snug ${
                activeId === heading.id
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const SocialShareButtons = ({ title, url }: { title: string; url: string }) => {
  const shareUrls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié !');
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => window.open(shareUrls.linkedin, '_blank')} className="w-9 h-9 rounded-full bg-[#0077B5] text-white flex items-center justify-center hover:opacity-80 transition-opacity" title="LinkedIn">
        <span className="text-sm font-bold">in</span>
      </button>
      <button onClick={() => window.open(shareUrls.facebook, '_blank')} className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity" title="Facebook">
        <span className="text-sm font-bold">f</span>
      </button>
      <button onClick={() => window.open(shareUrls.twitter, '_blank')} className="w-9 h-9 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity" title="Twitter">
        <span className="text-sm font-bold">𝕏</span>
      </button>
      <button onClick={copyLink} className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-opacity" title="Copier le lien">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
};

const RelatedPosts = ({ currentSlug }: { currentSlug: string }) => {
  const [posts, setPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    getPublishedPosts(4).then(data => {
      setPosts(data.filter(p => p.slug !== currentSlug).slice(0, 3));
    });
  }, [currentSlug]);

  if (posts.length === 0) return null;

  return (
    <section className="border-t pt-12 mt-12">
      <h3 className="text-2xl font-bold mb-6">Articles similaires</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map(post => (
          <Link key={post.id} to={`/blog/${post.slug}`} className="group">
            <ArticleCoverImage title={post.title} size="card" coverImageUrl={post.cover_image_url} className="aspect-video rounded-xl" />
            <h4 className="text-sm font-semibold mt-3 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-primary group-hover:translate-x-0.5 transition-transform" />
              Lire l'article
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);

  useEffect(() => {
    if (!slug) return;
    loadPost();
    return () => {
      if (post) {
        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
        trackTimeOnPage(post.id, timeSpent);
        trackScrollDepth(post.id, maxScroll.current);
      }
    };
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      maxScroll.current = Math.max(maxScroll.current, scrollPercent);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPost = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await getPostBySlug(slug);
      if (!data) { navigate('/blog', { replace: true }); return; }
      setPost(data);
      trackPageView(data.id);
      startTime.current = Date.now();
    } catch (error) {
      console.error('Error loading post:', error);
      navigate('/blog', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const processContent = (html: string) => {
    let headingIndex = 0;
    return html.replace(/<(h[23])([^>]*)>/gi, (match, tag, attrs) => {
      const id = `heading-${headingIndex++}`;
      return `<${tag}${attrs} id="${id}">`;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <div className="h-14 md:h-16" />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-2/3 mb-8" />
          <Skeleton className="aspect-video w-full rounded-xl mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-primary/5">
      <title>{post.seo_title || post.title} | Blog Nectforma</title>
      <meta name="description" content={post.seo_description || post.excerpt || ''} />
      <meta property="og:title" content={post.seo_title || post.title} />
      <meta property="og:description" content={post.seo_description || post.excerpt || ''} />
      <meta property="og:image" content={post.cover_image_url || ''} />
      <meta property="og:type" content="article" />
      {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}

      <LandingHeader />
      <div className="h-14 md:h-16" />

      {/* Breadcrumb bar */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            {post.category && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link to={`/blog?category=${post.category.slug}`} className="hover:text-foreground transition-colors">
                  {post.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground truncate max-w-[300px]">{post.title}</span>
          </nav>
        </div>
      </div>

      <article className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8 max-w-6xl mx-auto">
          
          {/* Left Sidebar: TOC + Social — Digiforma style */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <TableOfContents content={post.content} />
            </div>
          </aside>

          {/* Main Content — Framed */}
          <div className="min-w-0">
            <div className="bg-background rounded-2xl border-2 border-primary/30 shadow-lg shadow-primary/5 overflow-hidden">
              
              {/* Category label */}
              {post.category && (
                <div className="p-6 md:p-10 pb-0 md:pb-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    {post.category.name}
                  </span>
                </div>
              )}

              {/* Branded Cover Image with title + metadata */}
              <div className="px-6 md:px-10 pt-4 mb-8">
                <ArticleCoverImage 
                  title={post.title} 
                  size="hero" 
                  className="aspect-[16/7] rounded-xl shadow-md"
                  publishedAt={post.published_at}
                  readTime={post.read_time_minutes}
                  coverImageUrl={post.cover_image_url}
                />
              </div>


              {/* Content */}
              <div className="px-6 md:px-10 pb-8 md:pb-10">
                <div 
                  ref={contentRef}
                  className="prose prose-lg max-w-none dark:prose-invert 
                    prose-headings:scroll-mt-20
                    prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-10 prose-h1:mb-6
                    prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-primary prose-h2:border-l-4 prose-h2:border-primary prose-h2:pl-4
                    prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-primary/80
                    prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-3 prose-h4:text-primary/70
                    prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-5
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-xl prose-img:shadow-md prose-img:my-10 prose-img:border-2 prose-img:border-primary/10
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-5 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-primary/90 prose-blockquote:my-8
                    prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-muted prose-pre:border prose-pre:rounded-xl
                    prose-ul:text-foreground/80 prose-ol:text-foreground/80 prose-ul:my-6 prose-ol:my-6
                    prose-li:mb-3
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-table:border prose-table:rounded-xl prose-table:overflow-hidden prose-table:my-8 prose-table:shadow-sm
                    prose-th:bg-primary/10 prose-th:p-4 prose-th:text-left prose-th:text-primary prose-th:font-semibold
                    prose-td:p-4 prose-td:border-t
                    [&_.section-divider]:h-px [&_.section-divider]:bg-gradient-to-r [&_.section-divider]:from-transparent [&_.section-divider]:via-primary/30 [&_.section-divider]:to-transparent [&_.section-divider]:my-12
                    [&_.highlight-box]:bg-primary/5 [&_.highlight-box]:border-l-4 [&_.highlight-box]:border-primary [&_.highlight-box]:rounded-r-xl [&_.highlight-box]:p-6 [&_.highlight-box]:my-8 [&_.highlight-box_h4]:text-primary [&_.highlight-box_h4]:font-bold [&_.highlight-box_h4]:mb-2 [&_.highlight-box_h4]:mt-0 [&_.highlight-box_p]:mb-0
                    [&_.stat-box]:bg-gradient-to-br [&_.stat-box]:from-primary/10 [&_.stat-box]:to-primary/5 [&_.stat-box]:rounded-2xl [&_.stat-box]:p-6 [&_.stat-box]:my-8 [&_.stat-box]:text-center [&_.stat-box]:border [&_.stat-box]:border-primary/20
                    [&_.stat-number]:text-4xl [&_.stat-number]:font-bold [&_.stat-number]:text-primary [&_.stat-number]:block [&_.stat-number]:mb-2
                    [&_.stat-label]:text-sm [&_.stat-label]:text-muted-foreground [&_.stat-label]:block
                    [&_.info-box]:bg-blue-50 [&_.info-box]:dark:bg-blue-950/30 [&_.info-box]:border [&_.info-box]:border-blue-200 [&_.info-box]:dark:border-blue-800 [&_.info-box]:rounded-xl [&_.info-box]:p-6 [&_.info-box]:my-8 [&_.info-box_h4]:text-blue-700 [&_.info-box_h4]:dark:text-blue-300 [&_.info-box_h4]:font-bold [&_.info-box_h4]:mb-2 [&_.info-box_h4]:mt-0 [&_.info-box_p]:mb-0
                    [&_.warning-box]:bg-amber-50 [&_.warning-box]:dark:bg-amber-950/30 [&_.warning-box]:border [&_.warning-box]:border-amber-200 [&_.warning-box]:dark:border-amber-800 [&_.warning-box]:rounded-xl [&_.warning-box]:p-6 [&_.warning-box]:my-8 [&_.warning-box_h4]:text-amber-700 [&_.warning-box_h4]:dark:text-amber-300 [&_.warning-box_h4]:font-bold [&_.warning-box_h4]:mb-2 [&_.warning-box_h4]:mt-0 [&_.warning-box_p]:mb-0
                    [&_.article-cta]:bg-gradient-to-r [&_.article-cta]:from-primary [&_.article-cta]:to-primary/80 [&_.article-cta]:text-white [&_.article-cta]:rounded-2xl [&_.article-cta]:p-8 [&_.article-cta]:my-10 [&_.article-cta]:text-center [&_.article-cta_h4]:text-white [&_.article-cta_h4]:font-bold [&_.article-cta_h4]:text-xl [&_.article-cta_h4]:mb-3 [&_.article-cta_h4]:mt-0 [&_.article-cta_p]:text-white/90 [&_.article-cta_p]:mb-0
                    [&_.schema-box]:bg-card [&_.schema-box]:border-2 [&_.schema-box]:border-primary/20 [&_.schema-box]:rounded-2xl [&_.schema-box]:p-6 [&_.schema-box]:my-8 [&_.schema-box_h4]:text-primary [&_.schema-box_h4]:font-bold [&_.schema-box_h4]:mb-4 [&_.schema-box_h4]:mt-0
                    [&_.schema-steps]:flex [&_.schema-steps]:flex-wrap [&_.schema-steps]:gap-3 [&_.schema-steps]:items-center [&_.schema-steps]:justify-center
                    [&_.schema-step]:flex [&_.schema-step]:items-center [&_.schema-step]:gap-2 [&_.schema-step]:bg-primary/10 [&_.schema-step]:rounded-xl [&_.schema-step]:px-4 [&_.schema-step]:py-3
                    [&_.step-number]:w-8 [&_.step-number]:h-8 [&_.step-number]:rounded-full [&_.step-number]:bg-primary [&_.step-number]:text-white [&_.step-number]:flex [&_.step-number]:items-center [&_.step-number]:justify-center [&_.step-number]:font-bold [&_.step-number]:text-sm [&_.step-number]:shrink-0
                    [&_.step-text]:text-sm [&_.step-text]:font-medium
                    [&_.faq-section]:mt-12 [&_.faq-section]:pt-8 [&_.faq-section]:border-t-2 [&_.faq-section]:border-primary/20
                    [&_.faq-item]:bg-card [&_.faq-item]:border [&_.faq-item]:border-primary/15 [&_.faq-item]:rounded-xl [&_.faq-item]:p-6 [&_.faq-item]:my-4
                    [&_.faq-item_h3]:text-primary [&_.faq-item_h3]:mt-0 [&_.faq-item_h3]:mb-3
                    [&_.carousel-slide]:rounded-xl [&_.carousel-slide]:shadow-lg
                    [&_div[style*='background']]:rounded-xl [&_div[style*='background']]:my-4"
                  dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-primary/10">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                          <Badge variant="outline" className="hover:bg-primary/10 border-primary/20 transition-colors">
                            #{tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Author Card */}
            <div className="mt-8 p-6 rounded-2xl bg-background border-2 border-primary/20 flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Équipe Nectforma</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Passionnés par l'innovation pédagogique, nous partageons nos conseils et bonnes pratiques pour la gestion des formations.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button className="w-7 h-7 rounded-full bg-[#0077B5] text-white flex items-center justify-center text-xs hover:opacity-80">in</button>
                </div>
              </div>
            </div>

            {/* Related */}
            <RelatedPosts currentSlug={post.slug} />
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t bg-background py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="flex items-center gap-2 justify-center mb-4">
            <NectformaLogo variant="dark" size="md" />
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nectforma. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostPage;
