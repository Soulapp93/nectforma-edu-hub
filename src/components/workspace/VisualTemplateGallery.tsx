import React, { useState, useMemo } from 'react';
import { Search, X, ChevronRight, Star, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ALL_VISUAL_TEMPLATES, VISUAL_CATEGORIES, VISUAL_SUBCATEGORIES, VISUAL_FORMATS,
  type VisualTemplate
} from '@/data/visualTemplates';

interface Props {
  onSelect: (template: VisualTemplate) => void;
  onClose: () => void;
}

const TemplateCard: React.FC<{ template: VisualTemplate; onSelect: () => void }> = ({ template, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const aspectRatio = template.height / template.width;
  const previewH = Math.min(120, Math.max(60, 100 * aspectRatio));

  return (
    <div
      className="group relative cursor-pointer rounded-xl border-2 border-transparent hover:border-primary/60 transition-all duration-200 bg-card overflow-hidden shadow-sm hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {/* Preview */}
      <div
        className="relative overflow-hidden"
        style={{ height: previewH, background: template.canvas.background }}
      >
        {/* Mini canvas preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span style={{ fontSize: 36 }}>{template.thumbnail}</span>
            {/* Couleurs palette */}
            <div className="flex gap-1 justify-center mt-1">
              {template.colors.slice(0, 3).map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        {/* Hover overlay */}
        {hovered && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
              Utiliser ce template
            </div>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {template.isNew && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>
          )}
          {template.isPro && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">PRO</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-foreground truncate">{template.name}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{template.format}</p>
      </div>
    </div>
  );
};

const VisualTemplateGallery: React.FC<Props> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcat, setActiveSubcat] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState('Tous les formats');

  const subcats = activeCategory !== 'all' ? (VISUAL_SUBCATEGORIES[activeCategory] || []) : [];

  const filtered = useMemo(() => {
    return ALL_VISUAL_TEMPLATES.filter(t => {
      if (activeCategory !== 'all' && t.category !== activeCategory) return false;
      if (activeSubcat && t.subcategory !== activeSubcat) return false;
      if (activeFormat !== 'Tous les formats' && t.format !== activeFormat) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.includes(q)) ||
          t.subcategory.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, activeSubcat, activeFormat, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ALL_VISUAL_TEMPLATES.length };
    VISUAL_CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') c[cat.id] = ALL_VISUAL_TEMPLATES.filter(t => t.category === cat.id).length;
    });
    return c;
  }, []);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubcat(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-bold">Bibliothèque de templates</h2>
            <p className="text-xs text-muted-foreground">{ALL_VISUAL_TEMPLATES.length}+ modèles prêts à utiliser</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Categories */}
        <div className="w-44 border-r bg-muted/20 flex-shrink-0 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {VISUAL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{cat.emoji}</span>
                  <span className="truncate">{cat.label}</span>
                </span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${activeCategory === cat.id ? 'bg-white/20' : 'bg-muted'}`}>
                  {counts[cat.id] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Sous-catégories */}
          {subcats.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                Sous-catégories
              </div>
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => setActiveSubcat(null)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${!activeSubcat ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  Tous
                </button>
                {subcats.map(sc => (
                  <button
                    key={sc}
                    onClick={() => setActiveSubcat(sc)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${activeSubcat === sc ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Formats */}
          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">
            Format
          </div>
          <div className="p-2 space-y-0.5 pb-4">
            {VISUAL_FORMATS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFormat(f)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-all leading-tight ${activeFormat === f ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Right — Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Results bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-card/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{filtered.length} templates</span>
              {search && (
                <Badge variant="secondary" className="text-xs gap-1">
                  "{search}" <button onClick={() => setSearch('')}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {activeSubcat && (
                <Badge variant="outline" className="text-xs gap-1">
                  {activeSubcat} <button onClick={() => setActiveSubcat(null)}><X className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-base font-medium">Aucun template trouvé</p>
                  <p className="text-sm text-muted-foreground mt-1">Essayez d'autres mots-clés</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearch(''); setActiveCategory('all'); setActiveSubcat(null); }}>
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filtered.map(t => (
                    <TemplateCard key={t.id} template={t} onSelect={() => onSelect(t)} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default VisualTemplateGallery;
