import * as Blockly from 'blockly/core'
import { ref } from 'vue'
import { toolboxConfig } from '@/blockly/toolbox'

export const TOOLBOX_FULL_WIDTH = 200
export const TOOLBOX_COLLAPSED_WIDTH = 60

// Lucide-style SVG icons for each toolbox category (keyed by category name)
export const CATEGORY_ICONS: Record<string, string> = {
  // Input & Output — arrow-right-left
  'Input & Output': '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
  // Models & Agents — bot
  'Models & Agents': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  // Fact-Checking — shield-check
  'Fact-Checking': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  // Logic — git-branch
  'Logic': '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  // Loops — repeat-2
  'Loops': '<path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/>',
  // Math — pi
  'Math': '<line x1="9" x2="9" y1="4" y2="20"/><path d="M4 7c0-1.7 1.3-3 3-3h13"/><path d="M18 20c-1.7 0-3-1.3-3-3V4"/>',
  // Text — type
  'Text': '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  // Lists — list
  'Lists': '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  // Variables — variable
  'Variables': '<path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>',
  // Functions — braces
  'Functions': '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 1 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1 2 2 2 2 0 0 1-2 2v5a2 2 0 0 1-2 2h-1"/>',
}

export function useToolbox(getWorkspace: () => Blockly.WorkspaceSvg | null) {
  const toolboxCollapsed = ref(false)

  function injectToolboxIcons(workspace: Blockly.WorkspaceSvg): void {
    const toolbox = workspace.getToolbox() as any
    if (!toolbox?.HtmlDiv)
      return
    const categories = (toolbox.HtmlDiv as HTMLDivElement).querySelectorAll('.blocklyToolboxCategory')
    // Get the ordered category names from toolbox contents (skip separators)
    const catNames = toolboxConfig.contents
      .filter((c: any) => c.kind === 'category')
      .map((c: any) => c.name as string)

    let catIdx = 0
    categories.forEach((catEl) => {
      const name = catNames[catIdx]
      catIdx++
      if (!name)
        return
      const iconEl = catEl.querySelector('.blocklyToolboxCategoryIcon') as HTMLElement | null
      if (!iconEl)
        return
      const svgPaths = CATEGORY_ICONS[name]
      if (!svgPaths)
        return
      // Inject SVG into the icon element
      iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg>`
    })
  }

  function applyToolboxCollapse(workspace?: Blockly.WorkspaceSvg): void {
    const ws = workspace ?? getWorkspace()
    if (!ws)
      return
    const toolbox = ws.getToolbox() as any
    if (!toolbox?.HtmlDiv)
      return
    const div = toolbox.HtmlDiv as HTMLDivElement
    const collapsed = toolboxCollapsed.value

    div.style.width = `${collapsed ? TOOLBOX_COLLAPSED_WIDTH : TOOLBOX_FULL_WIDTH}px`
    div.classList.toggle('toolbox-collapsed', collapsed)

    // Override getWidth so Blockly positions the flyout and workspace correctly
    toolbox.width_ = collapsed ? TOOLBOX_COLLAPSED_WIDTH : TOOLBOX_FULL_WIDTH
    toolbox.getWidth = () => collapsed ? TOOLBOX_COLLAPSED_WIDTH : TOOLBOX_FULL_WIDTH
    toolbox.position()
    Blockly.svgResize(ws)
  }

  function toggleToolbox(): void {
    toolboxCollapsed.value = !toolboxCollapsed.value
    applyToolboxCollapse()
  }

  return {
    toolboxCollapsed,
    TOOLBOX_FULL_WIDTH,
    TOOLBOX_COLLAPSED_WIDTH,
    toggleToolbox,
    applyToolboxCollapse,
    injectToolboxIcons,
  }
}
