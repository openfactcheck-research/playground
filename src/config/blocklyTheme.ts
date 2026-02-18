import * as Blockly from 'blockly/core'

export function createDarkTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme(`darkTheme_${Date.now()}`, {
    name: 'darkTheme',
    base: Blockly.Themes.Classic,
    componentStyles: {
      // Matches app workspace/background
      workspaceBackgroundColour: '#1a1a1a',
      // Matches sidebar: #171717
      toolboxBackgroundColour: '#171717',
      toolboxForegroundColour: '#e0e0e0',
      flyoutBackgroundColour: '#1a1a1a',
      flyoutForegroundColour: '#e0e0e0',
      flyoutOpacity: 0.98,
      scrollbarColour: '#3a3a3a',
      scrollbarOpacity: 0.7,
      insertionMarkerColour: '#00897b', // brand-teal influenced
      insertionMarkerOpacity: 0.4,
      cursorColour: '#00897b',
    },
    blockStyles: {
      logic_blocks: { colourPrimary: '#5b80a5', colourSecondary: '#4a6d8c', colourTertiary: '#3a5a73' },
      loop_blocks: { colourPrimary: '#5ba580', colourSecondary: '#4a8c6d', colourTertiary: '#3a735a' },
      math_blocks: { colourPrimary: '#5b67a5', colourSecondary: '#4a558c', colourTertiary: '#3a4373' },
      text_blocks: { colourPrimary: '#a55b80', colourSecondary: '#8c4a6d', colourTertiary: '#733a5a' },
      list_blocks: { colourPrimary: '#745ba5', colourSecondary: '#604a8c', colourTertiary: '#4c3a73' },
      variable_blocks: { colourPrimary: '#a55b5b', colourSecondary: '#8c4a4a', colourTertiary: '#733a3a' },
      procedure_blocks: { colourPrimary: '#995ba5', colourSecondary: '#804a8c', colourTertiary: '#663a73' },
    },
    categoryStyles: {
      logic_category: { colour: '#5b80a5' },
      loop_category: { colour: '#5ba580' },
      math_category: { colour: '#5b67a5' },
      text_category: { colour: '#a55b80' },
      list_category: { colour: '#745ba5' },
      variable_category: { colour: '#a55b5b' },
      procedure_category: { colour: '#995ba5' },
    },
  })
}

export function createLightTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme(`lightTheme_${Date.now()}`, {
    name: 'lightTheme',
    base: Blockly.Themes.Classic,
    componentStyles: {
      // Matches --background light: oklch(1 0 0) = #ffffff
      workspaceBackgroundColour: '#ffffff',
      // Matches --card light: oklch(1 0 0) = #ffffff
      toolboxBackgroundColour: '#ffffff',
      toolboxForegroundColour: '#212121',
      // Matches --secondary light: oklch(0.97 0 0) ≈ #f5f5f5
      flyoutBackgroundColour: '#f5f5f5',
      flyoutForegroundColour: '#212121',
      flyoutOpacity: 0.98,
      scrollbarColour: '#bdbdbd',
      scrollbarOpacity: 0.7,
      insertionMarkerColour: '#005355', // brand-teal
      insertionMarkerOpacity: 0.4,
      cursorColour: '#005355',
    },
    blockStyles: {
      logic_blocks: { colourPrimary: '#5b80a5', colourSecondary: '#7a9bc0', colourTertiary: '#9ab5d5' },
      loop_blocks: { colourPrimary: '#5ba580', colourSecondary: '#7ac09b', colourTertiary: '#9ad5b5' },
      math_blocks: { colourPrimary: '#5b67a5', colourSecondary: '#7a85c0', colourTertiary: '#9aa3d5' },
      text_blocks: { colourPrimary: '#a55b80', colourSecondary: '#c07a9b', colourTertiary: '#d59ab5' },
      list_blocks: { colourPrimary: '#745ba5', colourSecondary: '#907ac0', colourTertiary: '#ab9ad5' },
      variable_blocks: { colourPrimary: '#a55b5b', colourSecondary: '#c07a7a', colourTertiary: '#d59a9a' },
      procedure_blocks: { colourPrimary: '#995ba5', colourSecondary: '#b37ac0', colourTertiary: '#cc9ad5' },
    },
    categoryStyles: {
      logic_category: { colour: '#5b80a5' },
      loop_category: { colour: '#5ba580' },
      math_category: { colour: '#5b67a5' },
      text_category: { colour: '#a55b80' },
      list_category: { colour: '#745ba5' },
      variable_category: { colour: '#a55b5b' },
      procedure_category: { colour: '#995ba5' },
    },
  })
}

export function createTheme(isDark: boolean): Blockly.Theme {
  return isDark ? createDarkTheme() : createLightTheme()
}
