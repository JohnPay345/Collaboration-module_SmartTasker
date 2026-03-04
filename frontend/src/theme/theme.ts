import { fonts, fontSizes, lineHeights } from '@src/theme/fonts';

export const lightTheme = {
  colors: {
    primary: '#0096FF',
    background: '#FFFFFF',
    text: '#000000',
    secondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
  },
  fonts,
  fontSizes,
  lineHeights,
} as const;

export const darkTheme = {
  colors: {
    primary: '#0096FF',
    background: '#1F2937',
    text: '#FFFFFF',
    secondary: '#9CA3AF',
    border: '#374151',
    error: '#EF4444',
    success: '#10B981',
  },
  fonts,
  fontSizes,
  lineHeights,
} as const;

export type Theme = typeof lightTheme; 