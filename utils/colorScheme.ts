// Modern design system with consistent colors
export const COLORS = {
  // Vibrant neon accents
  neon: {
    electric: '#00f5ff',
    purple: '#a855f7',
    pink: '#f472b6',
    green: '#22c55e',
    orange: '#f97316',
    cyan: '#06b6d4',
    yellow: '#eab308',
    red: '#ef4444',
  },
  
  // Deep space backgrounds
  background: {
    primary: '#0a0a0f',
    secondary: '#111827',
    tertiary: '#1f2937',
    glass: 'rgba(255, 255, 255, 0.08)',
    glassDark: 'rgba(0, 0, 0, 0.4)',
  },
  
  // Core brand colors
  primary: '#00f5ff',
  primaryLight: '#67e8f9',
  primaryDark: '#0891b2',
  secondary: '#a855f7',
  accent: '#f472b6',
  success: '#22c55e',
  warning: '#f97316',
  error: '#ef4444',
  
  // Glass morphism surfaces
  surface: {
    glass: 'rgba(255, 255, 255, 0.12)',
    glassDark: 'rgba(0, 0, 0, 0.4)',
    glassLight: 'rgba(255, 255, 255, 0.18)',
    card: 'rgba(255, 255, 255, 0.1)',
    cardHover: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Glowing borders
  border: {
    glass: 'rgba(255, 255, 255, 0.25)',
    glassLight: 'rgba(255, 255, 255, 0.15)',
    neon: 'rgba(0, 245, 255, 0.4)',
    accent: 'rgba(168, 85, 247, 0.4)',
  },
  
  // High contrast text
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.85)',
    tertiary: 'rgba(255, 255, 255, 0.7)',
    inverse: '#000000',
    accent: '#00f5ff',
    neon: '#a855f7',
  },
  
  // Stunning gradients
  gradient: {
    primary: ['#00f5ff', '#a855f7'],
    secondary: ['#a855f7', '#f472b6'],
    accent: ['#06b6d4', '#22c55e'],
    glass: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)'],
    card: ['rgba(0, 245, 255, 0.15)', 'rgba(168, 85, 247, 0.15)'],
    background: ['#0a0a0f', '#111827', '#1f2937'],
    hero: ['#0a0a0f', '#1e1b4b', '#312e81'],
  },
  
  // Glowing shadows
  shadow: {
    neon: '0 0 20px rgba(0, 245, 255, 0.3)',
    purple: '0 0 20px rgba(168, 85, 247, 0.3)',
    pink: '0 0 20px rgba(244, 114, 182, 0.3)',
    green: '0 0 20px rgba(34, 197, 94, 0.3)',
    card: '0 8px 32px rgba(0, 0, 0, 0.3)',
    glass: '0 8px 32px rgba(255, 255, 255, 0.1)',
  },
};

// Typography scale
export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Border radius scale
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};
