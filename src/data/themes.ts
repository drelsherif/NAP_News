import type { ThemePreset } from '../types';

export const THEMES: ThemePreset[] = [
  {
    id: 'professional',
    name: 'Professional Blue',
    primary: '#003087',
    secondary: '#0057A8',
    accent: '#009CDE',
    background: '#F0F4FA',
    surface: '#FFFFFF',
    border: '#C8D9EE',
    text: '#1A2B4A',
    muted: '#5A789A',
    fontDisplay: '"DM Serif Display", Georgia, serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    fontMono: '"DM Mono", ui-monospace, monospace',
  },
  {
    id: 'midnight',
    name: 'Midnight Clinical',
    primary: '#0A0F1E',
    secondary: '#1A2744',
    accent: '#4FFFB0',
    background: '#080C18',
    surface: '#0F1628',
    border: '#1E2E50',
    text: '#E8F0FF',
    muted: '#6B82AA',
    fontDisplay: '"DM Serif Display", Georgia, serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    fontMono: '"DM Mono", ui-monospace, monospace',
  },
  {
    id: 'editorial',
    name: 'Editorial Print',
    primary: '#1A1A1A',
    secondary: '#333333',
    accent: '#C0392B',
    background: '#F5F0E8',
    surface: '#FEFCF8',
    border: '#D4CABC',
    text: '#1A1A1A',
    muted: '#7A6E62',
    fontDisplay: '"DM Serif Display", Georgia, serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    fontMono: '"DM Mono", ui-monospace, monospace',
  },
  {
    id: 'teal',
    name: 'Teal & Sand',
    primary: '#005F6B',
    secondary: '#008891',
    accent: '#F4A261',
    background: '#F7F3EE',
    surface: '#FFFFFF',
    border: '#D4CFC7',
    text: '#2C3E3F',
    muted: '#7A8C8D',
    fontDisplay: '"DM Serif Display", Georgia, serif',
    fontBody: '"DM Sans", system-ui, sans-serif',
    fontMono: '"DM Mono", ui-monospace, monospace',
  },
];

export function applyTheme(theme: ThemePreset) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-bg', theme.background);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-muted', theme.muted);
  root.style.setProperty('--font-display', theme.fontDisplay);
  root.style.setProperty('--font-body', theme.fontBody);
  root.style.setProperty('--font-mono', theme.fontMono);
}
