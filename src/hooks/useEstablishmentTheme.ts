import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMyContext } from './useMyContext';

export interface EstablishmentTheme {
  primary: string | null;
  secondary: string | null;
  sidebar: string | null;
  background: string | null;
}

// Default theme values (matches index.css :root)
const DEFAULT_THEME: Required<Record<keyof EstablishmentTheme, string>> = {
  primary: '258 62% 35%',
  secondary: '270 55% 45%',
  sidebar: '258 55% 22%',
  background: '0 0% 100%',
};

// Generate derived HSL values from a base HSL string
function parseHSL(hsl: string): { h: number; s: number; l: number } | null {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  if (isNaN(h) || isNaN(s) || isNaN(l)) return null;
  return { h, s, l };
}

function hslString(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function applyThemeToDOM(theme: EstablishmentTheme) {
  const root = document.documentElement;
  
  const primary = theme.primary || DEFAULT_THEME.primary;
  const secondary = theme.secondary || DEFAULT_THEME.secondary;
  const sidebar = theme.sidebar || DEFAULT_THEME.sidebar;
  const background = theme.background || DEFAULT_THEME.background;

  const p = parseHSL(primary);
  const s = parseHSL(sidebar);
  
  // Primary colors
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--ring', primary);
  
  // Accent
  root.style.setProperty('--accent', secondary);
  
  // Derived primary colors
  if (p) {
    root.style.setProperty('--nect-primary-from', primary);
    root.style.setProperty('--nect-primary-to', secondary);
    root.style.setProperty('--nect-primary-light', hslString(p.h, Math.min(p.s, 40), 95));
    root.style.setProperty('--nect-primary-dark', hslString(p.h, p.s, Math.max(p.l - 10, 15)));
    
    // Secondary token
    root.style.setProperty('--secondary', hslString(p.h, 30, 96));
    root.style.setProperty('--secondary-foreground', hslString(p.h, p.s, Math.max(p.l - 5, 20)));
    
    // Muted
    root.style.setProperty('--muted', hslString(p.h, 20, 95));
    root.style.setProperty('--muted-foreground', hslString(p.h, 10, 42));
    
    // Border & input
    root.style.setProperty('--border', hslString(p.h, 15, 88));
    root.style.setProperty('--input', hslString(p.h, 15, 92));
    
    // Gradients
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${primary}), hsl(${secondary}))`);
    root.style.setProperty('--gradient-hero', `linear-gradient(135deg, hsl(${primary}), hsl(${secondary}))`);
    root.style.setProperty('--gradient-soft', `linear-gradient(135deg, hsl(${hslString(p.h, 40, 97)}), hsl(${hslString(p.h, 35, 95)}))`);
    
    // Shadows with primary hue
    const shadowBase = `${p.h}, ${Math.round(p.s)}%, ${Math.round(p.l)}%`;
    root.style.setProperty('--shadow-sm', `0 1px 3px hsla(${shadowBase}, 0.06)`);
    root.style.setProperty('--shadow-md', `0 4px 16px hsla(${shadowBase}, 0.10)`);
    root.style.setProperty('--shadow-lg', `0 12px 32px hsla(${shadowBase}, 0.14)`);
  }
  
  // Sidebar colors
  root.style.setProperty('--nect-sidebar-bg', sidebar);
  root.style.setProperty('--sidebar-background', sidebar);
  if (s) {
    root.style.setProperty('--sidebar-border', hslString(s.h, s.s, Math.min(s.l + 10, 40)));
    root.style.setProperty('--nect-sidebar-dark', hslString(s.h, Math.max(s.s - 5, 0), Math.max(s.l - 4, 5)));
  }
  
  // Background
  root.style.setProperty('--background', background);
  root.style.setProperty('--card', background);
  
  // Page background
  if (p) {
    document.body.style.backgroundColor = `hsl(${hslString(p.h, 20, 97)})`;
  }
}

function clearThemeFromDOM() {
  const root = document.documentElement;
  const props = [
    '--primary', '--ring', '--accent', '--nect-primary-from', '--nect-primary-to',
    '--nect-primary-light', '--nect-primary-dark', '--secondary', '--secondary-foreground',
    '--muted', '--muted-foreground', '--border', '--input', '--gradient-primary',
    '--gradient-hero', '--gradient-soft', '--shadow-sm', '--shadow-md', '--shadow-lg',
    '--nect-sidebar-bg', '--sidebar-background', '--sidebar-border', '--background', '--card'
  ];
  props.forEach(p => root.style.removeProperty(p));
  document.body.style.removeProperty('background-color');
}

export const useEstablishmentTheme = () => {
  const { establishment } = useMyContext();
  const [theme, setTheme] = useState<EstablishmentTheme | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTheme = useCallback(async () => {
    if (!establishment?.id) {
      clearThemeFromDOM();
      setTheme(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('theme_primary, theme_secondary, theme_sidebar, theme_background')
        .eq('id', establishment.id)
        .single();

      if (error) {
        console.error('Error fetching theme:', error);
        setLoading(false);
        return;
      }

      const t: EstablishmentTheme = {
        primary: data.theme_primary,
        secondary: data.theme_secondary,
        sidebar: data.theme_sidebar,
        background: data.theme_background,
      };

      setTheme(t);
      applyThemeToDOM(t);
    } catch (err) {
      console.error('Error in useEstablishmentTheme:', err);
    } finally {
      setLoading(false);
    }
  }, [establishment?.id]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  // Listen for realtime changes on establishments
  useEffect(() => {
    if (!establishment?.id) return;

    const channel = supabase
      .channel(`theme-${establishment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'establishments',
          filter: `id=eq.${establishment.id}`
        },
        () => {
          fetchTheme();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishment?.id, fetchTheme]);

  const saveTheme = useCallback(async (newTheme: EstablishmentTheme) => {
    if (!establishment?.id) return;

    const { error } = await supabase
      .from('establishments')
      .update({
        theme_primary: newTheme.primary,
        theme_secondary: newTheme.secondary,
        theme_sidebar: newTheme.sidebar,
        theme_background: newTheme.background,
      })
      .eq('id', establishment.id);

    if (error) throw error;

    setTheme(newTheme);
    applyThemeToDOM(newTheme);
  }, [establishment?.id]);

  const resetTheme = useCallback(async () => {
    if (!establishment?.id) return;

    const { error } = await supabase
      .from('establishments')
      .update({
        theme_primary: null,
        theme_secondary: null,
        theme_sidebar: null,
        theme_background: null,
      })
      .eq('id', establishment.id);

    if (error) throw error;

    setTheme(null);
    clearThemeFromDOM();
  }, [establishment?.id]);

  return { theme, loading, saveTheme, resetTheme, DEFAULT_THEME };
};
