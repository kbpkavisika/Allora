/**
 * Design tokens for the Allora app.
 * Source of truth: design.md (§01 Colour, §02 Typography). Do not hardcode
 * hex values or font specs elsewhere — use these tokens instead.
 */

import type { TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

const palette = {
  light: {
    primary: '#101112',
    'primary-hover': '#2E3133',
    secondary: '#63686D',
    disabled: '#9BA0A5',
    border: '#E4E6E8',
    'border-strong': '#8C9297',
    // design.md uses #C9CDD1 for inert furniture §01 never names: the sheet grabber,
    // inactive carousel dots, and disabled chip / sold-out cell text.
    inert: '#C9CDD1',
    surface: '#FFFFFF',
    'surface-muted': '#F7F8F8',
    'surface-sunken': '#F1F2F3',
    accent: '#D33A2C',
    'accent-pressed': '#B62E22',
    'accent-tint': '#FBEDEB',
    info: '#2F6BD8',
    'info-track': '#B9CDF2',
    'info-tint': '#EDF2FC',
    success: '#197A4B',
    'success-tint': '#E8F3EC',
    warning: '#8A5300',
    'warning-tint': '#FBF2E3',
    error: '#C4291F',
    'error-tint': '#FBEBEA',
  },
  dark: {
    primary: '#F5F5F6',
    'primary-hover': '#E4E6E8',
    secondary: '#9BA0A5',
    disabled: '#5C6165',
    border: '#2A2B2D',
    'border-strong': '#72777C',
    inert: '#4A4E52',
    surface: '#101112',
    'surface-muted': '#1C1D1E',
    'surface-sunken': '#252627',
    accent: '#D33A2C',
    'accent-pressed': '#B62E22',
    'accent-tint': '#2C1613',
    info: '#2F6BD8',
    'info-track': '#24406E',
    'info-tint': '#16233B',
    success: '#22A566',
    'success-tint': '#12261C',
    warning: '#C97F1D',
    'warning-tint': '#2C2211',
    error: '#E5544A',
    'error-tint': '#2E1614',
  },
} as const;

export const Colors = palette;

export type ColorToken = keyof typeof palette.light;

export const Spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  16: 64,
} as const;

export const Radius = {
  0: 0,
  DEFAULT: 8,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  full: 9999,
} as const;

export const BorderWidth = {
  DEFAULT: 1,
  0: 0,
  1: 1,
  1.5: 1.5,
  1.75: 1.75,
  3: 3,
} as const;

export const ControlSize = {
  lg: 52,
  md: 44,
  sm: 36,
  tap: 44,
  glyph: 32,
  field: 54,
} as const;

export const Fonts = {
  archivo: {
    regular: 'Archivo_400Regular',
    medium: 'Archivo_500Medium',
    semiBold: 'Archivo_600SemiBold',
    bold: 'Archivo_700Bold',
    extraBold: 'Archivo_800ExtraBold',
    black: 'Archivo_900Black',
  },
  ibmPlexMono: {
    regular: 'IBMPlexMono_400Regular',
    medium: 'IBMPlexMono_500Medium',
  },
} as const;

type TypographySpec = Omit<TextStyle, 'color'> & { colorToken: ColorToken };

export const typographySpecs = {
  splash: {
    fontFamily: Fonts.archivo.extraBold,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -0.03 * 56,
    colorToken: 'primary',
  },
  display: {
    fontFamily: Fonts.archivo.extraBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.03 * 34,
    colorToken: 'primary',
  },
  wordmark: {
    fontFamily: Fonts.archivo.extraBold,
    fontSize: 22,
    letterSpacing: -0.03 * 22,
    colorToken: 'primary',
  },
  h1: {
    fontFamily: Fonts.archivo.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.025 * 28,
    colorToken: 'primary',
  },
  h2: {
    fontFamily: Fonts.archivo.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.02 * 22,
    colorToken: 'primary',
  },
  h3: {
    fontFamily: Fonts.archivo.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.01 * 18,
    colorToken: 'primary',
  },
  // design.md §07: top bar titles are 17/600, a ramp §02 does not otherwise list.
  title: {
    fontFamily: Fonts.archivo.semiBold,
    fontSize: 17,
    lineHeight: 24,
    colorToken: 'primary',
  },
  // design.md §07: inactive scroll tabs are 17/500 in `secondary`.
  'title-muted': {
    fontFamily: Fonts.archivo.medium,
    fontSize: 17,
    lineHeight: 24,
    colorToken: 'secondary',
  },
  'text-lg': {
    fontFamily: Fonts.archivo.regular,
    fontSize: 17,
    lineHeight: 24,
    colorToken: 'primary',
  },
  'text-primary': {
    fontFamily: Fonts.archivo.regular,
    fontSize: 15,
    lineHeight: 22,
    colorToken: 'primary',
  },
  'text-secondary': {
    fontFamily: Fonts.archivo.regular,
    fontSize: 13,
    lineHeight: 18,
    colorToken: 'secondary',
  },
  'label-lg': {
    fontFamily: Fonts.archivo.semiBold,
    fontSize: 15,
    lineHeight: 22,
    colorToken: 'primary',
  },
  label: {
    fontFamily: Fonts.archivo.semiBold,
    fontSize: 14,
    lineHeight: 20,
    colorToken: 'primary',
  },
  'label-sm': {
    fontFamily: Fonts.archivo.semiBold,
    fontSize: 13,
    lineHeight: 18,
    colorToken: 'primary',
  },
  overline: {
    fontFamily: Fonts.archivo.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1 * 11,
    textTransform: 'uppercase',
    colorToken: 'accent-pressed',
  },
  mono: {
    fontFamily: Fonts.ibmPlexMono.regular,
    fontSize: 13,
    lineHeight: 18,
    colorToken: 'primary',
  },
} satisfies Record<string, TypographySpec>;

export type TypographyToken = keyof typeof typographySpecs;

export function getTypography(token: TypographyToken, scheme: ColorScheme): TextStyle {
  const { colorToken, ...style } = typographySpecs[token];
  return { ...style, color: Colors[scheme][colorToken] };
}
