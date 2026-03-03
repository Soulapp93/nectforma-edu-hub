import React, { createContext, useContext, useMemo } from 'react';

export interface QuizTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  bgGradient: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  particleColor: string;
  correctColor: string;
  wrongColor: string;
  timerColor: string;
  buttonStyle: string;
}

export const QUIZ_THEMES: Record<string, QuizTheme> = {
  classique: {
    id: 'classique', name: 'Classique',
    primaryColor: '#8B5CF6', secondaryColor: '#EC4899',
    bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: 'rgba(255,255,255,0.15)', textColor: '#ffffff',
    accentColor: '#F59E0B', fontFamily: 'Inter',
    particleColor: '#8B5CF6', correctColor: '#10B981', wrongColor: '#EF4444',
    timerColor: '#F59E0B', buttonStyle: 'rounded-2xl shadow-lg',
  },
  neon: {
    id: 'neon', name: 'Néon',
    primaryColor: '#00ff87', secondaryColor: '#60efff',
    bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)',
    cardBg: 'rgba(0,255,135,0.08)', textColor: '#ffffff',
    accentColor: '#ff006e', fontFamily: 'Inter',
    particleColor: '#00ff87', correctColor: '#00ff87', wrongColor: '#ff006e',
    timerColor: '#60efff', buttonStyle: 'rounded-xl border-2 border-[#00ff87]/50 shadow-[0_0_20px_rgba(0,255,135,0.3)]',
  },
  futuriste: {
    id: 'futuriste', name: 'Futuriste',
    primaryColor: '#06b6d4', secondaryColor: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #0f172a 100%)',
    cardBg: 'rgba(6,182,212,0.1)', textColor: '#e2e8f0',
    accentColor: '#f472b6', fontFamily: 'Inter',
    particleColor: '#06b6d4', correctColor: '#34d399', wrongColor: '#f87171',
    timerColor: '#06b6d4', buttonStyle: 'rounded-lg border border-cyan-500/30 backdrop-blur-xl',
  },
  manga: {
    id: 'manga', name: 'Manga',
    primaryColor: '#ef4444', secondaryColor: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)',
    cardBg: 'rgba(255,255,255,0.9)', textColor: '#1f2937',
    accentColor: '#ef4444', fontFamily: '"Comic Sans MS", cursive',
    particleColor: '#ef4444', correctColor: '#22c55e', wrongColor: '#ef4444',
    timerColor: '#ef4444', buttonStyle: 'rounded-xl border-4 border-black shadow-[4px_4px_0px_#000]',
  },
  minimal: {
    id: 'minimal', name: 'Minimal',
    primaryColor: '#1f2937', secondaryColor: '#6b7280',
    bgGradient: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    cardBg: 'rgba(255,255,255,0.95)', textColor: '#111827',
    accentColor: '#3b82f6', fontFamily: 'Inter',
    particleColor: '#d1d5db', correctColor: '#059669', wrongColor: '#dc2626',
    timerColor: '#3b82f6', buttonStyle: 'rounded-lg border border-gray-200',
  },
  espace: {
    id: 'espace', name: 'Espace',
    primaryColor: '#a78bfa', secondaryColor: '#c084fc',
    bgGradient: 'linear-gradient(135deg, #0f0720 0%, #1e1145 30%, #2d1b69 60%, #0f0720 100%)',
    cardBg: 'rgba(167,139,250,0.1)', textColor: '#e9d5ff',
    accentColor: '#fbbf24', fontFamily: 'Inter',
    particleColor: '#fbbf24', correctColor: '#4ade80', wrongColor: '#f87171',
    timerColor: '#c084fc', buttonStyle: 'rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(167,139,250,0.2)]',
  },
  dark: {
    id: 'dark', name: 'Dark Mode',
    primaryColor: '#f1f5f9', secondaryColor: '#94a3b8',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    cardBg: 'rgba(255,255,255,0.05)', textColor: '#f1f5f9',
    accentColor: '#38bdf8', fontFamily: 'Inter',
    particleColor: '#475569', correctColor: '#4ade80', wrongColor: '#f87171',
    timerColor: '#38bdf8', buttonStyle: 'rounded-xl border border-slate-700 bg-slate-800/50',
  },
  corporate: {
    id: 'corporate', name: 'Corporate',
    primaryColor: '#1e40af', secondaryColor: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
    cardBg: 'rgba(255,255,255,0.12)', textColor: '#ffffff',
    accentColor: '#fbbf24', fontFamily: 'Inter',
    particleColor: '#3b82f6', correctColor: '#22c55e', wrongColor: '#ef4444',
    timerColor: '#fbbf24', buttonStyle: 'rounded-lg shadow-md',
  },
};

const ThemeContext = createContext<QuizTheme>(QUIZ_THEMES.classique);

export const useQuizTheme = () => useContext(ThemeContext);

interface Props {
  themeId?: string;
  customConfig?: Partial<QuizTheme>;
  children: React.ReactNode;
}

export const QuizThemeProvider: React.FC<Props> = ({ themeId = 'classique', customConfig, children }) => {
  const theme = useMemo(() => {
    const base = QUIZ_THEMES[themeId] || QUIZ_THEMES.classique;
    return customConfig ? { ...base, ...customConfig } : base;
  }, [themeId, customConfig]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
