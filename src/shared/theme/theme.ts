import {
  defaultPaletteVariant,
  durations,
  eventPalettes,
  fonts,
  layout,
  paletteVariantNames,
  paletteVariants,
  radius,
  resolvePalette,
  spacing,
  typography,
  type EventColor,
  type Palette,
  type PaletteOverride,
  type PaletteVariant,
} from './tokens';

/** A concrete rendered appearance. */
export type ColorScheme = 'light' | 'dark';

/**
 * What the *user* chose. `system` follows the OS and is the default, which is
 * why it is a separate type from `ColorScheme`.
 */
export type ThemeMode = ColorScheme | 'system';

export const themeModes: readonly ThemeMode[] = ['system', 'light', 'dark'] as const;

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (themeModes as readonly string[]).includes(value);
}

export type Theme = {
  /**
   * Stable identity of this exact appearance, `"<variant>:<scheme>"` for
   * registered variants. `createStyles` caches compiled stylesheets by this
   * key, so any two themes that differ visually must differ here.
   */
  id: string;
  /** Which palette variant produced this theme. */
  variant: string;
  scheme: ColorScheme;
  colors: Palette;
  /** Identity colors for calendar owners; index modulo length. */
  eventColors: readonly EventColor[];
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fonts: typeof fonts;
  durations: typeof durations;
  layout: typeof layout;
};

/**
 * Builds a theme from an arbitrary palette override.
 *
 * This is the runtime entry point for white-labelling: a tenant's brand colors
 * fetched from the API become a theme without touching the token registry.
 * Give it a stable `id` (e.g. the school id) — reusing an id across different
 * colors would serve stale cached styles.
 *
 * @example
 * const schoolTheme = createTheme({
 *   id: `school-${school.id}`,
 *   scheme: 'light',
 *   override: { brand: school.brandColor, brandHover: school.brandColorDark },
 * });
 */
export function createTheme(params: {
  id: string;
  scheme: ColorScheme;
  variant?: string;
  override?: PaletteOverride;
}): Theme {
  const { id, scheme, variant = id, override } = params;
  return {
    id: `${id}:${scheme}`,
    variant,
    scheme,
    colors: resolvePalette(scheme, override),
    eventColors: eventPalettes[scheme],
    spacing,
    radius,
    typography,
    fonts,
    durations,
    layout,
  };
}

/**
 * Every registered variant × scheme, built once at module load, so a theme
 * object is a stable reference for the lifetime of the app.
 *
 * Indexed `themes[variant][scheme]`.
 */
export const themes = Object.fromEntries(
  paletteVariantNames.map((variant) => [
    variant,
    {
      light: createTheme({ id: variant, scheme: 'light', override: paletteVariants[variant].light }),
      dark: createTheme({ id: variant, scheme: 'dark', override: paletteVariants[variant].dark }),
    },
  ]),
) as Record<PaletteVariant, Record<ColorScheme, Theme>>;

/** The theme used before any preference is known (context default, tests). */
export const defaultTheme = themes[defaultPaletteVariant].light;

/** Resolves the user's mode against the current OS scheme. */
export function resolveScheme(mode: ThemeMode, systemScheme: ColorScheme): ColorScheme {
  return mode === 'system' ? systemScheme : mode;
}
