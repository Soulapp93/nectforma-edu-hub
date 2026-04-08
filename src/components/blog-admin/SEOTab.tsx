import React from 'react';
import { Globe, Eye, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/services/blogService';

const SEOTab = ({ posts }: { posts: BlogPost[] }) => {
  const keywordCounts: Record<string, number> = {};
  posts.forEach(post => {
    (post.seo_keywords || []).forEach(kw => {
      const k = kw.toLowerCase().trim();
      if (k) keywordCounts[k] = (keywordCounts[k] || 0) + 1;
    });
  });

  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  const postsWithSEO = posts.filter(p => p.seo_title || p.seo_description || (p.seo_keywords && p.seo_keywords.length > 0));
  const postsWithoutSEO = posts.filter(p => !p.seo_title && !p.seo_description && (!p.seo_keywords || p.seo_keywords.length === 0));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Articles optimisés SEO" value={postsWithSEO.length} icon={Target} />
        <StatCard title="Sans SEO" value={postsWithoutSEO.length} icon={Globe} />
        <StatCard title="Mots-clés uniques" value={Object.keys(keywordCounts).length} icon={KeyRound} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Mots-clés les plus utilisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedKeywords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun mot-clé SEO défini</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedKeywords.map(([keyword, count]) => (
                <Badge key={keyword} variant="secondary" className="px-3 py-1.5">
                  {keyword} <span className="ml-1.5 text-xs bg-primary/20 text-primary rounded-full px-1.5">{count}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Articles sans optimisation SEO</CardTitle>
        </CardHeader>
        <CardContent>
          {postsWithoutSEO.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Tous les articles sont optimisés ! 🎉</p>
          ) : (
            <div className="space-y-2">
              {postsWithoutSEO.map(post => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{post.title}</span>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">À optimiser</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


export { SEOTab };
