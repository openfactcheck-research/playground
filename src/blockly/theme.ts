import * as Blockly from 'blockly/core'

/**
 * Pastel color palette for Blockly categories
 * Each category gets a unique color from this 12-color palette
 */
const PALETTE = {
  teal: '#66c5cc', // Functions/Procedures
  yellow: '#f6cf71', // Math
  orange: '#f89c74', // Fact-Checking
  lavender: '#dcb0f2', // Lists
  green: '#88c560', // Loops
  blue: '#9eb9f3', // Logic
  pink: '#fe88b1', // Text
  lime: '#c9db74', // (reserved)
  mint: '#8ce0a4', // Variables
  violet: '#b497e7', // AI
  tan: '#d3b484', // (reserved)
  gray: '#b3b3b3', // (reserved)
}

// Utility to darken a hex color
function darken(hex: string, percent: number): string {
  const num = Number.parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((num >> 16) & 0xFF) * (1 - percent))
  const g = Math.max(0, ((num >> 8) & 0xFF) * (1 - percent))
  const b = Math.max(0, (num & 0xFF) * (1 - percent))
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

// Utility to lighten a hex color
function lighten(hex: string, percent: number): string {
  const num = Number.parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((num >> 16) & 0xFF) + (255 - ((num >> 16) & 0xFF)) * percent)
  const g = Math.min(255, ((num >> 8) & 0xFF) + (255 - ((num >> 8) & 0xFF)) * percent)
  const b = Math.min(255, (num & 0xFF) + (255 - (num & 0xFF)) * percent)
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

// Block style with darker variants for 3D effect
function blockStyle(primary: string, isDark: boolean) {
  return {
    colourPrimary: primary,
    colourSecondary: isDark ? darken(primary, 0.15) : lighten(primary, 0.15),
    colourTertiary: isDark ? darken(primary, 0.3) : darken(primary, 0.1),
  }
}

export function createDarkTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme(`darkTheme_${Date.now()}`, {
    name: 'darkTheme',
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#1a1a1a',
      toolboxBackgroundColour: '#171717',
      toolboxForegroundColour: '#e0e0e0',
      flyoutBackgroundColour: '#1a1a1a',
      flyoutForegroundColour: '#e0e0e0',
      flyoutOpacity: 0.98,
      scrollbarColour: '#3a3a3a',
      scrollbarOpacity: 0.7,
      insertionMarkerColour: '#00897b',
      insertionMarkerOpacity: 0.4,
      cursorColour: '#00897b',
    },
    blockStyles: {
      ai_blocks: blockStyle(PALETTE.violet, true),
      factcheck_blocks: blockStyle(PALETTE.orange, true),
      logic_blocks: blockStyle(PALETTE.blue, true),
      loop_blocks: blockStyle(PALETTE.green, true),
      math_blocks: blockStyle(PALETTE.yellow, true),
      text_blocks: blockStyle(PALETTE.pink, true),
      list_blocks: blockStyle(PALETTE.lavender, true),
      variable_blocks: blockStyle(PALETTE.mint, true),
      procedure_blocks: blockStyle(PALETTE.teal, true),
    },
    categoryStyles: {
      ai_category: { colour: PALETTE.violet },
      factcheck_category: { colour: PALETTE.orange },
      logic_category: { colour: PALETTE.blue },
      loop_category: { colour: PALETTE.green },
      math_category: { colour: PALETTE.yellow },
      text_category: { colour: PALETTE.pink },
      list_category: { colour: PALETTE.lavender },
      variable_category: { colour: PALETTE.mint },
      procedure_category: { colour: PALETTE.teal },
    },
  })
}

export function createLightTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme(`lightTheme_${Date.now()}`, {
    name: 'lightTheme',
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#ffffff',
      toolboxBackgroundColour: '#ffffff',
      toolboxForegroundColour: '#212121',
      flyoutBackgroundColour: '#f5f5f5',
      flyoutForegroundColour: '#212121',
      flyoutOpacity: 0.98,
      scrollbarColour: '#bdbdbd',
      scrollbarOpacity: 0.7,
      insertionMarkerColour: '#005355',
      insertionMarkerOpacity: 0.4,
      cursorColour: '#005355',
    },
    blockStyles: {
      ai_blocks: blockStyle(PALETTE.violet, false),
      factcheck_blocks: blockStyle(PALETTE.orange, false),
      logic_blocks: blockStyle(PALETTE.blue, false),
      loop_blocks: blockStyle(PALETTE.green, false),
      math_blocks: blockStyle(PALETTE.yellow, false),
      text_blocks: blockStyle(PALETTE.pink, false),
      list_blocks: blockStyle(PALETTE.lavender, false),
      variable_blocks: blockStyle(PALETTE.mint, false),
      procedure_blocks: blockStyle(PALETTE.teal, false),
    },
    categoryStyles: {
      ai_category: { colour: PALETTE.violet },
      factcheck_category: { colour: PALETTE.orange },
      logic_category: { colour: PALETTE.blue },
      loop_category: { colour: PALETTE.green },
      math_category: { colour: PALETTE.yellow },
      text_category: { colour: PALETTE.pink },
      list_category: { colour: PALETTE.lavender },
      variable_category: { colour: PALETTE.mint },
      procedure_category: { colour: PALETTE.teal },
    },
  })
}

export function createTheme(isDark: boolean): Blockly.Theme {
  return isDark ? createDarkTheme() : createLightTheme()
}

// Export palette for use in custom blocks
export { PALETTE }
