/**
 * Theme Preset Definitions
 * Based on theming.md documentation
 */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'free' | 'paid';
  isPreset: true;
  colors: {
    primary: Record<number, string>;
    accent: string;
    neutral: Record<number, string>;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    border: {
      default: string;
      light: string;
      dark: string;
    };
  };
  typography?: {
    fontFamily: {
      heading: string;
      body: string;
      mono: string;
    };
  };
}

// Tailwind default neutral palette
const NEUTRAL_PALETTE = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
};

// === FREE TIER PRESETS (3) ===

export const MODERN_GREEN: ThemePreset = {
  id: 'modern-green',
  name: 'Modern Green',
  description: 'Clean and professional green theme perfect for wellness, beauty, and health services',
  category: 'Modern',
  tier: 'free',
  isPreset: true,
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    accent: '#3b82f6',
    neutral: NEUTRAL_PALETTE,
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
    border: {
      default: '#e5e7eb',
      light: '#f3f4f6',
      dark: '#d1d5db',
    },
  },
};

export const CLASSIC_BLUE: ThemePreset = {
  id: 'classic-blue',
  name: 'Classic Blue',
  description: 'Timeless and trustworthy blue theme ideal for professional services and consultants',
  category: 'Classic',
  tier: 'free',
  isPreset: true,
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: '#8b5cf6',
    neutral: NEUTRAL_PALETTE,
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
    border: {
      default: '#e5e7eb',
      light: '#f3f4f6',
      dark: '#d1d5db',
    },
  },
};

export const MINIMAL_BLACK: ThemePreset = {
  id: 'minimal-black',
  name: 'Minimal Black',
  description: 'Clean monochrome sophistication for modern creatives, photographers, and designers',
  category: 'Minimal',
  tier: 'free',
  isPreset: true,
  colors: {
    primary: NEUTRAL_PALETTE,
    accent: '#6366f1',
    neutral: NEUTRAL_PALETTE,
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#6366f1',
    background: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f5f5f5',
    },
    text: {
      primary: '#171717',
      secondary: '#525252',
      tertiary: '#737373',
      inverse: '#ffffff',
    },
    border: {
      default: '#e5e5e5',
      light: '#f5f5f5',
      dark: '#d4d4d4',
    },
  },
};

// === PAID TIER PRESETS (3) ===

export const BOLD_ORANGE: ThemePreset = {
  id: 'bold-orange',
  name: 'Bold Orange',
  description: 'Vibrant and energetic theme for creative services and events',
  category: 'Bold',
  tier: 'paid',
  isPreset: true,
  colors: {
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    accent: '#ec4899',
    neutral: NEUTRAL_PALETTE,
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: {
      primary: '#ffffff',
      secondary: '#fffbeb',
      tertiary: '#fef3c7',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
    border: {
      default: '#e5e7eb',
      light: '#f3f4f6',
      dark: '#d1d5db',
    },
  },
  typography: {
    fontFamily: {
      heading: 'Montserrat, sans-serif',
      body: 'Inter, sans-serif',
      mono: 'ui-monospace, monospace',
    },
  },
};

export const ELEGANT_PURPLE: ThemePreset = {
  id: 'elegant-purple',
  name: 'Elegant Purple',
  description: 'Luxurious purple theme for premium beauty and luxury spa services',
  category: 'Elegant',
  tier: 'paid',
  isPreset: true,
  colors: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    accent: '#ec4899',
    neutral: NEUTRAL_PALETTE,
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#8b5cf6',
    background: {
      primary: '#ffffff',
      secondary: '#fdf4ff',
      tertiary: '#fae8ff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
    border: {
      default: '#e5e7eb',
      light: '#f3f4f6',
      dark: '#d1d5db',
    },
  },
  typography: {
    fontFamily: {
      heading: 'Playfair Display, serif',
      body: 'Inter, sans-serif',
      mono: 'ui-monospace, monospace',
    },
  },
};

export const PLAYFUL_PINK: ThemePreset = {
  id: 'playful-pink',
  name: 'Playful Pink',
  description: 'Fun and vibrant pink theme for youth-oriented services and fun brands',
  category: 'Playful',
  tier: 'paid',
  isPreset: true,
  colors: {
    primary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    },
    accent: '#8b5cf6',
    neutral: NEUTRAL_PALETTE,
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: {
      primary: '#ffffff',
      secondary: '#fdf2f8',
      tertiary: '#fce7f3',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
    border: {
      default: '#e5e7eb',
      light: '#f3f4f6',
      dark: '#d1d5db',
    },
  },
  typography: {
    fontFamily: {
      heading: 'Poppins, sans-serif',
      body: 'Inter, sans-serif',
      mono: 'ui-monospace, monospace',
    },
  },
};

// Export all presets
export const ALL_PRESETS: ThemePreset[] = [
  MODERN_GREEN,
  CLASSIC_BLUE,
  MINIMAL_BLACK,
  BOLD_ORANGE,
  ELEGANT_PURPLE,
  PLAYFUL_PINK,
];

export const FREE_PRESETS: ThemePreset[] = ALL_PRESETS.filter((p) => p.tier === 'free');
export const PAID_PRESETS: ThemePreset[] = ALL_PRESETS.filter((p) => p.tier === 'paid');

/**
 * Get preset by ID
 */
export function getPresetById(id: string): ThemePreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

/**
 * Get presets by tier
 */
export function getPresetsByTier(tier: 'free' | 'paid' | 'all'): ThemePreset[] {
  if (tier === 'free') return FREE_PRESETS;
  if (tier === 'paid') return ALL_PRESETS;
  return ALL_PRESETS;
}
