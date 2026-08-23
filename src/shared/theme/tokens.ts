// Defines the `--font-*` custom properties the web font stacks below resolve
// against. Metro treats the import as a no-op on native.
import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

/**
 * Design tokens.
 *
 * Rules of the road:
 * - Colors are **semantic**, never literal. Use `colors.textSecondary`, not
 *   `colors.gray600`. Adding a raw hex inside a component is the one thing that
 *   breaks theming, so palettes are the only place hex values may appear.
 * - `light` and `dark` are structurally identical (`Palette` is derived from
 *   `light`), so a color added to one is a compile error until it exists in both.
 */

const lightColors = {
  /** App canvas. */
  background: '#FFFFFF',
  /** Cards, sheets, list rows sitting on the canvas. */
  surface: '#F6F7F9',
  /** A surface that needs to read as raised (menus, popovers). */
  surfaceElevated: '#FFFFFF',
  /** Pressed / selected state for surfaces. */
  surfaceActive: '#E7E9ED',
  /** Disabled or de-emphasized fills. */
  surfaceMuted: '#EFF0F3',

  border: '#E1E3E8',
  borderStrong: '#C7CAD1',

  text: '#0B0C0E',
  textSecondary: '#5B6069',
  textMuted: '#8A8F98',
  /** Text placed on top of `brand` / `danger` / other solid fills. */
  textOnAccent: '#FFFFFF',

  /** Primary brand accent: buttons, active tabs, links. */
  brand: '#E86B1F',
  brandHover: '#D25E17',
  /** Tinted brand background (badges, selected rows). */
  brandSoft: '#FCEDE2',

  success: '#1F8A4C',
  successSoft: '#E4F4EA',
  warning: '#B8730B',
  warningSoft: '#FBF0DC',
  danger: '#C8372D',
  dangerSoft: '#FBE9E7',
  info: '#2563C9',
  infoSoft: '#E5EDFB',

  /** Scrim behind modals and sheets. */
  overlay: 'rgba(11, 12, 14, 0.45)',
  /** Skeleton / shimmer base. */
  skeleton: '#E7E9ED',
} as const;

/** Structural contract every palette must satisfy. */
export type Palette = { readonly [K in keyof typeof lightColors]: string };

const darkColors: Palette = {
  background: '#0B0C0E',
  surface: '#16181C',
  surfaceElevated: '#1D2025',
  surfaceActive: '#2A2E35',
  surfaceMuted: '#202328',

  border: '#2A2E35',
  borderStrong: '#3D424B',

  text: '#F5F6F7',
  textSecondary: '#A8AEB8',
  textMuted: '#767C86',
  textOnAccent: '#FFFFFF',

  brand: '#FF8438',
  brandHover: '#FF9553',
  brandSoft: '#3A2413',

  success: '#3FBF74',
  successSoft: '#17301F',
  warning: '#E0A030',
  warningSoft: '#33270F',
  danger: '#F0685C',
  dangerSoft: '#3A1A17',
  info: '#5A9BFF',
  infoSoft: '#152640',

  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#20242A',
};

/**
 * The neutral foundation: canvas, surfaces, borders, text and status colors.
 * Shared by every palette variant, so a change here lands in all of them.
 */
export const basePalettes = { light: lightColors, dark: darkColors } as const;

/** A partial palette layered on top of a base palette. */
export type PaletteOverride = Partial<Palette>;

export type PaletteVariantTokens = {
  light: PaletteOverride;
  dark: PaletteOverride;
};

/**
 * Palette variants — the second theming axis, orthogonal to light/dark.
 *
 * A variant only overrides what actually differs (normally the accent family),
 * which is why `fox` is empty: it *is* the base. Neutrals stay defined once, so
 * adding a variant is a few lines rather than a second full palette.
 *
 * This is the seam for white-labelling: a school's brand color becomes either a
 * new entry here or a runtime `createTheme({ override })` call.
 */
export const paletteVariants = {
  fox: {
    light: {},
    dark: {},
  },
  indigo: {
    light: { brand: '#4C5EE0', brandHover: '#3F4FC7', brandSoft: '#E8EAFB' },
    dark: { brand: '#8A97FF', brandHover: '#9DA8FF', brandSoft: '#1E2245' },
  },
  forest: {
    light: { brand: '#1F7A55', brandHover: '#186344', brandSoft: '#E3F2EB' },
    dark: { brand: '#3FBF8C', brandHover: '#57CE9E', brandSoft: '#133326' },
  },
} as const satisfies Record<string, PaletteVariantTokens>;

export type PaletteVariant = keyof typeof paletteVariants;

export const paletteVariantNames = Object.keys(paletteVariants) as PaletteVariant[];

export const defaultPaletteVariant: PaletteVariant = 'fox';

export function isPaletteVariant(value: unknown): value is PaletteVariant {
  return typeof value === 'string' && value in paletteVariants;
}

/** Flattens a variant onto the base palette for one scheme. */
export function resolvePalette(
  scheme: keyof typeof basePalettes,
  override: PaletteOverride = {},
): Palette {
  return { ...basePalettes[scheme], ...override };
}

/**
 * Colors for calendar owners.
 *
 * A separate ramp from the semantic palette on purpose: these are *identity*
 * colors (whose calendar is this) rather than meaning colors, they must stay
 * distinguishable side by side, and their count is fixed while the number of
 * visible calendars is not — callers index into it modulo its length.
 */
export type EventColor = {
  /** Left accent bar, dots, the solid chip in a filter list. */
  solid: string;
  /** Event block background. */
  soft: string;
  /** Text and icons drawn on `soft`. */
  onSoft: string;
};

export const eventPalettes = {
  light: [
    { solid: '#E86B1F', soft: '#FCEDE2', onSoft: '#7A3409' },
    { solid: '#4C5EE0', soft: '#E8EAFB', onSoft: '#232C7A' },
    { solid: '#1F7A55', soft: '#E3F2EB', onSoft: '#0E3B29' },
    { solid: '#8B3FBF', soft: '#F2E8FB', onSoft: '#451F60' },
    { solid: '#B8730B', soft: '#FBF0DC', onSoft: '#5C3A06' },
  ],
  dark: [
    { solid: '#FF8438', soft: '#3A2413', onSoft: '#FFC8A3' },
    { solid: '#8A97FF', soft: '#1E2245', onSoft: '#C6CCFF' },
    { solid: '#3FBF8C', soft: '#133326', onSoft: '#A8E8CC' },
    { solid: '#C98AF0', soft: '#2C1A3A', onSoft: '#E4C8F7' },
    { solid: '#E0A030', soft: '#33270F', onSoft: '#F5D9A3' },
  ],
} as const satisfies Record<'light' | 'dark', readonly EventColor[]>;

/**
 * Spacing scale (4pt base). Named by step rather than by pixel value so the
 * scale can be retuned without a project-wide find/replace.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  /** Pills and avatars. */
  full: 999,
} as const;

export const fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
})!;

/**
 * Text styles, not raw font sizes: a component picks a role
 * (`typography.titleMd`) and inherits size, weight and line height together.
 * Colors are deliberately absent — those come from the palette.
 */
export const typography = {
  displayLg: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.4 },
  titleLg: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.2 },
  titleMd: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  titleSm: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.2 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  mono: { fontSize: 14, lineHeight: 20, fontFamily: fonts.mono },
} as const satisfies Record<string, TextStyle>;

/** Animation durations (ms), so motion stays consistent across features. */
export const durations = {
  instant: 90,
  fast: 160,
  normal: 240,
  slow: 380,
} as const;

/** Fixed layout constants shared by screens. */
export const layout = {
  maxContentWidth: 800,
  /** Comfortable minimum tap target. */
  minTouchSize: 44,
} as const;
