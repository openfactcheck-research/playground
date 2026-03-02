// ---------------------------------------------------------------------------
// Blockly theme definitions — dark and light.
//
// Structure:
//   1. Full Tailwind color palette (all 23 colors × 11 shades)
//   2. Hex color utilities (darken / lighten)
//   3. Active block palettes (reference specific shades from TW)
//   4. Block style builder
//   5. Category → color map (single source of truth)
//   6. Style object builders (derived from the map)
//   7. Theme factory functions (exported)
// ---------------------------------------------------------------------------

import * as Blockly from 'blockly/core'

// ---------------------------------------------------------------------------
// Full Tailwind color palette — all 23 colors, all 11 shades (50–950).
// Source: tailwindcss.com/docs/colors (hex equivalents of the v4 OKLCH values).
// Pick any shade when defining PALETTE_DARK / PALETTE_LIGHT below.
// ---------------------------------------------------------------------------

const TW = {
  // --- Reds / Warm ---
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  orange: {
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
    950: '#431407',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  // --- Greens ---
  lime: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
    950: '#1a2e05',
  },
  green: {
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
    950: '#052e16',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },
  // --- Blues ---
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  blue: {
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
    950: '#172554',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  // --- Purples / Pinks ---
  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  purple: {
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
    950: '#3b0764',
  },
  fuchsia: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },
  pink: {
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
    950: '#500724',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  // --- Neutrals ---
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  neutral: {
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
    950: '#0a0a0a',
  },
  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
}

// ---------------------------------------------------------------------------
// Palette type — shared by both dark and light palettes.
// ---------------------------------------------------------------------------

type Palette = {
  violet: string
  orange: string
  sky: string
  blue: string
  green: string
  amber: string
  pink: string
  purple: string
  emerald: string
  teal: string
  slate: string
}

// ---------------------------------------------------------------------------
// Active block palettes — pick one shade per hue for each theme.
// Swap a shade number here to restyle that category across both block and
// category styles simultaneously.
// ---------------------------------------------------------------------------

// Subtle dark palette — fill: TW-600 blended 30% toward neutral-900.
// Outline: TW-870 (mix of 800/900 at 0.7) blended 24% toward neutral-800.
const PALETTE_DARK_SUBTLE: Palette = {
  violet: mix(TW.violet[600], TW.neutral[900], 0.30),
  orange: mix(TW.orange[600], TW.neutral[900], 0.30),
  sky: mix(TW.sky[600], TW.neutral[900], 0.30),
  blue: mix(TW.blue[600], TW.neutral[900], 0.30),
  green: mix(TW.green[600], TW.neutral[900], 0.30),
  amber: mix(TW.amber[600], TW.neutral[900], 0.30),
  pink: mix(TW.pink[600], TW.neutral[900], 0.30),
  purple: mix(TW.purple[600], TW.neutral[900], 0.30),
  emerald: mix(TW.emerald[600], TW.neutral[900], 0.30),
  teal: mix(TW.teal[600], TW.neutral[900], 0.30),
  slate: mix(TW.slate[600], TW.neutral[900], 0.30),
}

const PALETTE_DARK_SUBTLE_OUTLINE: Palette = {
  violet: mix(mix(TW.violet[800], TW.violet[900], 0.70), TW.neutral[800], 0.24),
  orange: mix(mix(TW.orange[800], TW.orange[900], 0.70), TW.neutral[800], 0.24),
  sky: mix(mix(TW.sky[800], TW.sky[900], 0.70), TW.neutral[800], 0.24),
  blue: mix(mix(TW.blue[800], TW.blue[900], 0.70), TW.neutral[800], 0.24),
  green: mix(mix(TW.green[800], TW.green[900], 0.70), TW.neutral[800], 0.24),
  amber: mix(mix(TW.amber[800], TW.amber[900], 0.70), TW.neutral[800], 0.24),
  pink: mix(mix(TW.pink[800], TW.pink[900], 0.70), TW.neutral[800], 0.24),
  purple: mix(mix(TW.purple[800], TW.purple[900], 0.70), TW.neutral[800], 0.24),
  emerald: mix(mix(TW.emerald[800], TW.emerald[900], 0.70), TW.neutral[800], 0.24),
  teal: mix(mix(TW.teal[800], TW.teal[900], 0.70), TW.neutral[800], 0.24),
  slate: mix(mix(TW.slate[800], TW.slate[900], 0.70), TW.neutral[800], 0.24),
}

const PALETTE_LIGHT: Palette = {
  violet: TW.violet[200],
  orange: TW.orange[200],
  sky: TW.sky[200],
  blue: TW.blue[200],
  green: TW.green[200],
  amber: TW.amber[200],
  pink: TW.pink[200],
  purple: TW.purple[200],
  emerald: TW.emerald[200],
  teal: TW.teal[200],
  slate: TW.slate[200],
}

// Outline color for light mode blocks.
const PALETTE_LIGHT_OUTLINE: Palette = {
  violet: TW.violet[500],
  orange: TW.orange[500],
  sky: TW.sky[500],
  blue: TW.blue[500],
  green: TW.green[500],
  amber: TW.amber[500],
  pink: TW.pink[500],
  purple: TW.purple[500],
  emerald: TW.emerald[500],
  teal: TW.teal[500],
  slate: TW.slate[500],
}

// Export dark palette as PALETTE for block files that call this.setColour(PALETTE.violet).
export { PALETTE_DARK_SUBTLE as PALETTE }

// ---------------------------------------------------------------------------
// Hex color utilities
// ---------------------------------------------------------------------------

/** Unpacks a `#rrggbb` hex string into an [r, g, b] tuple (0–255 each). */
function hexToRgb(hex: string): [number, number, number] {
  const num = Number.parseInt(hex.slice(1), 16)
  return [(num >> 16) & 0xFF, (num >> 8) & 0xFF, num & 0xFF]
}

/** Packs three 0–255 channel values back into a `#rrggbb` hex string. */
function rgbToHex(r: number, g: number, b: number): string {
  const ch = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${ch(r)}${ch(g)}${ch(b)}`
}

/** Linearly interpolates between two hex colors. `t=0` returns `a`, `t=1` returns `b`. */
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

/** Returns a darker version of `hex` by scaling each channel toward 0 by `percent` (0–1). */
function darken(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(
    Math.max(0, r * (1 - percent)),
    Math.max(0, g * (1 - percent)),
    Math.max(0, b * (1 - percent)),
  )
}

/** Returns a lighter version of `hex` by scaling each channel toward 255 by `percent` (0–1). */
function lighten(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(
    Math.min(255, r + (255 - r) * percent),
    Math.min(255, g + (255 - g) * percent),
    Math.min(255, b + (255 - b) * percent),
  )
}

// ---------------------------------------------------------------------------
// Block style builder
//
// Blockly uses three color levels per block:
//   primary   — main block fill
//   secondary — input socket / value hole fill
//   tertiary  — block border / shadow
// ---------------------------------------------------------------------------

/**
 * Builds a Blockly block style from a fill color and an optional outline color.
 *   colourPrimary   — main block fill
 *   colourSecondary — input socket fill (auto-derived from fill)
 *   colourTertiary  — block border / outline (defaults to darkened fill if not provided)
 */
function blockStyle(fill: string, isDark: boolean, outline?: string) {
  return {
    colourPrimary: fill,
    colourSecondary: isDark ? darken(fill, 0.10) : lighten(fill, 0.20),
    colourTertiary: outline ?? (isDark ? darken(fill, 0.25) : darken(fill, 0.15)),
  }
}

// ---------------------------------------------------------------------------
// Category → color map  (single source of truth)
//
// Keys are bare category names; they are expanded to `{key}_blocks` and
// `{key}_category` when building Blockly's blockStyles / categoryStyles.
// ---------------------------------------------------------------------------

type PaletteKey = keyof Palette

/**
 * Maps each Blockly category/block-style key to a palette color name.
 * Edit here to remap a category — both blockStyles and categoryStyles
 * are derived automatically from this map.
 */
const CATEGORY_COLOUR_MAP: Record<string, PaletteKey> = {
  ai: 'violet',
  factcheck: 'orange',
  io: 'sky',
  logic: 'blue',
  loop: 'green',
  math: 'amber',
  text: 'pink',
  list: 'purple',
  variable: 'emerald',
  procedure: 'teal',
  files: 'slate',
  datasource: 'sky',
  llmops: 'violet',
}

// ---------------------------------------------------------------------------
// Style object builders — derived from CATEGORY_COLOUR_MAP + a palette
// ---------------------------------------------------------------------------

/** Builds the `blockStyles` object for a theme from the given palette, with an optional outline palette. */
function buildBlockStyles(palette: Palette, isDark: boolean, outlinePalette?: Palette) {
  return Object.fromEntries(
    Object.entries(CATEGORY_COLOUR_MAP).map(([key, colour]) => [
      `${key}_blocks`,
      blockStyle(palette[colour], isDark, outlinePalette?.[colour]),
    ]),
  )
}

/** Builds the `categoryStyles` object for a theme from the given palette. */
function buildCategoryStyles(palette: Palette) {
  return Object.fromEntries(
    Object.entries(CATEGORY_COLOUR_MAP).map(([key, colour]) => [
      `${key}_category`,
      { colour: palette[colour] },
    ]),
  )
}

// ---------------------------------------------------------------------------
// Theme factories
//
// Component styles (workspace, toolbox, flyout) use neutral grays — kept
// intentionally separate from the block palette so chrome stays neutral.
//
// `Date.now()` is appended to theme names because Blockly caches themes by
// name — a unique suffix forces re-registration on every call (e.g. HMR).
// ---------------------------------------------------------------------------

export function createDarkTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme(`darkTheme_${Date.now()}`, {
    name: 'darkTheme',
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#171717', // neutral-900
      toolboxBackgroundColour: '#171717', // neutral-900
      toolboxForegroundColour: '#e5e5e5', // neutral-200
      flyoutBackgroundColour: '#171717', // neutral-900
      flyoutForegroundColour: '#e5e5e5', // neutral-200
      flyoutOpacity: 0.98,
      insertionMarkerColour: '#00897b',
      insertionMarkerOpacity: 0.4,
      cursorColour: '#00897b',
    },
    blockStyles: buildBlockStyles(PALETTE_DARK_SUBTLE, true, PALETTE_DARK_SUBTLE_OUTLINE),
    categoryStyles: buildCategoryStyles(PALETTE_DARK_SUBTLE),
    fontStyle: { family: 'Geist, sans-serif', size: 11 },
  })
}

export function createLightTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme(`lightTheme_${Date.now()}`, {
    name: 'lightTheme',
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#fafafa', // neutral-50
      toolboxBackgroundColour: '#fafafa', // neutral-50
      toolboxForegroundColour: '#0a0a0a', // neutral-950
      flyoutBackgroundColour: '#f5f5f5', // neutral-100
      flyoutForegroundColour: '#0a0a0a', // neutral-950
      flyoutOpacity: 0.98,
      insertionMarkerColour: '#005355', // brand primary
      insertionMarkerOpacity: 0.4,
      cursorColour: '#005355', // brand primary
    },
    blockStyles: buildBlockStyles(PALETTE_LIGHT, false, PALETTE_LIGHT_OUTLINE),
    categoryStyles: buildCategoryStyles(PALETTE_LIGHT),
    fontStyle: { family: 'Geist, sans-serif', size: 11 },
  })
}

/** Convenience wrapper — picks dark or light theme based on a boolean flag. */
export function createTheme(isDark: boolean): Blockly.Theme {
  return isDark ? createDarkTheme() : createLightTheme()
}
