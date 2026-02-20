<script setup lang="ts">
import { ZoomToFitControl } from '@blockly/zoom-to-fit'
import * as Blockly from 'blockly/core'
import * as En from 'blockly/msg/en'
import { pythonGenerator } from 'blockly/python'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { registerAllBlocks } from '@/blockly/blocks'
import { setInputText } from '@/blockly/blocks/claimInput'
import { createTheme } from '@/blockly/theme'
import { toolboxConfig } from '@/blockly/toolbox'
import '@/blockly/styles.css'
import 'blockly/blocks'

const props = defineProps<{
  inputText?: string
  workspaceId: string
}>()

const emit = defineEmits<{
  codeChange: [code: string]
  blockCountChange: [count: number]
}>()

// Register custom blocks before workspace creation
registerAllBlocks()

// Events that trigger code regeneration (module-scoped for efficiency)
const SUPPORTED_EVENTS: Set<string> = new Set([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_MOVE,
])

const WORKSPACE_STORAGE_KEY_PREFIX = 'blockly-workspace-state'
const CLIPBOARD_STORAGE_KEY = 'blockly-blocks-clipboard'

// Track current workspace ID for proper save/load
let currentWorkspaceId = props.workspaceId

// Storage key based on current workspace ID
function getStorageKey(id: string = currentWorkspaceId): string {
  return `${WORKSPACE_STORAGE_KEY_PREFIX}-${id}`
}

// For backward compatibility with computed references
const storageKey = computed(() => getStorageKey(props.workspaceId))

Blockly.setLocale(En as unknown as Record<string, string>)

const blocklyDiv = ref<HTMLElement>()

// Store workspace outside of Vue reactivity to prevent proxy issues
// and ensure cleanup survives HMR cycles
let _workspace: Blockly.WorkspaceSvg | null = null
let _zoomToFit: ZoomToFitControl | null = null
let _resizeObserver: ResizeObserver | null = null
let _themeObserver: MutationObserver | null = null

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

function updateTheme(): void {
  if (!_workspace)
    return
  _workspace.setTheme(createTheme(isDarkMode()))
}

function getBlockCount(): number {
  if (!_workspace)
    return 0
  return _workspace.getAllBlocks(false).length
}

function generateCode(): void {
  if (!_workspace)
    return

  // Always emit block count
  emit('blockCountChange', getBlockCount())

  try {
    const code = pythonGenerator.workspaceToCode(_workspace)
    emit('codeChange', code)
  }
  catch {
    // Expected: generator may fail for incomplete blocks (e.g., empty inputs)
  }
}

function clearWorkspace(): void {
  if (!_workspace)
    return
  _workspace.clear()
  localStorage.removeItem(storageKey.value)
  emit('codeChange', '')
  emit('blockCountChange', 0)
}

function undo(): void {
  _workspace?.undo(false)
}

function redo(): void {
  _workspace?.undo(true)
}

// Copy/paste functionality for cross-tab block sharing
function copySelectedBlocks(): boolean {
  if (!_workspace)
    return false

  const selected = Blockly.getSelected()
  if (!selected || !(selected instanceof Blockly.BlockSvg))
    return false

  try {
    // Serialize the selected block (includes child blocks)
    const blockState = Blockly.serialization.blocks.save(selected)
    localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(blockState))
    return true
  }
  catch {
    return false
  }
}

function pasteBlocks(): boolean {
  if (!_workspace)
    return false

  try {
    const clipboardData = localStorage.getItem(CLIPBOARD_STORAGE_KEY)
    if (!clipboardData)
      return false

    const blockState = JSON.parse(clipboardData)

    // Offset position slightly so pasted blocks don't overlap originals
    if (blockState.x !== undefined)
      blockState.x += 20
    if (blockState.y !== undefined)
      blockState.y += 20

    // Append the block to the workspace
    Blockly.serialization.blocks.append(blockState, _workspace)
    generateCode()
    saveWorkspace()
    return true
  }
  catch {
    return false
  }
}

function hasSelectedBlocks(): boolean {
  if (!_workspace)
    return false
  const selected = Blockly.getSelected()
  return selected instanceof Blockly.BlockSvg
}

function hasClipboardData(): boolean {
  return !!localStorage.getItem(CLIPBOARD_STORAGE_KEY)
}

function resize(): void {
  if (_workspace)
    Blockly.svgResize(_workspace)
}

function saveWorkspace(workspaceId?: string): void {
  if (!_workspace)
    return
  try {
    const state = Blockly.serialization.workspaces.save(_workspace)
    const key = workspaceId ? getStorageKey(workspaceId) : storageKey.value
    localStorage.setItem(key, JSON.stringify(state))
  }
  catch {
    // Ignore serialization errors
  }
}

function loadWorkspace(workspaceId?: string): void {
  if (!_workspace)
    return
  try {
    const key = workspaceId ? getStorageKey(workspaceId) : storageKey.value
    const saved = localStorage.getItem(key)
    _workspace.clear()
    if (saved) {
      const state = JSON.parse(saved)
      Blockly.serialization.workspaces.load(state, _workspace)
    }
    // Clear undo stack after loading - prevents undoing the initial load
    _workspace.clearUndo()
  }
  catch {
    // Ignore deserialization errors, start fresh
    localStorage.removeItem(storageKey.value)
  }
}

function getState(): object | null {
  if (!_workspace)
    return null
  try {
    return Blockly.serialization.workspaces.save(_workspace)
  }
  catch {
    return null
  }
}

function setState(state: object): void {
  if (!_workspace)
    return
  try {
    _workspace.clear()
    Blockly.serialization.workspaces.load(state, _workspace)
    generateCode()
  }
  catch {
    // Ignore errors
  }
}

defineExpose({
  clearWorkspace,
  undo,
  redo,
  resize,
  saveWorkspace,
  loadWorkspace,
  getState,
  setState,
  copySelectedBlocks,
  pasteBlocks,
  hasSelectedBlocks,
  hasClipboardData,
})

// Watch for input text changes and regenerate code
watch(() => props.inputText, (newText) => {
  setInputText(newText ?? '')
  generateCode()
}, { immediate: true })

// Watch for workspace ID changes (tab switching)
watch(() => props.workspaceId, (newId, oldId) => {
  if (!_workspace || newId === oldId)
    return
  // Save current workspace to the OLD key
  saveWorkspace(oldId)
  // Update current workspace ID tracker
  currentWorkspaceId = newId
  // Load workspace from the NEW key
  loadWorkspace(newId)
  // Generate code for the new workspace
  generateCode()
})

function cleanup() {
  if (_themeObserver) {
    _themeObserver.disconnect()
    _themeObserver = null
  }
  if (_resizeObserver) {
    _resizeObserver.disconnect()
    _resizeObserver = null
  }
  if (_zoomToFit) {
    _zoomToFit.dispose()
    _zoomToFit = null
  }
  if (_workspace) {
    saveWorkspace()
    _workspace.dispose()
    _workspace = null
  }
}

onMounted(() => {
  if (!blocklyDiv.value)
    return

  // ALWAYS clean up first -- critical for Vite HMR which may
  // re-run onMounted without a prior onBeforeUnmount
  cleanup()

  // Also forcibly clear any stale Blockly DOM that survived
  const el = blocklyDiv.value
  el.innerHTML = ''

  const dark = isDarkMode()

  _workspace = Blockly.inject(el, {
    toolbox: toolboxConfig,
    theme: createTheme(dark),
    grid: {
      spacing: 25,
      length: 3,
      colour: dark ? '#2a2a2a' : '#e0e0e0',
      snap: true,
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.9,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
    },
    trashcan: true,
    move: {
      scrollbars: true,
      drag: true,
      wheel: true,
    },
    renderer: 'thrasos',
    sounds: true,
  })
  // Real-time code generation following official Blockly pattern
  _workspace.addChangeListener((event) => {
    if (!_workspace)
      return
    if (_workspace.isDragging())
      return
    if (!SUPPORTED_EVENTS.has(event.type as string))
      return
    generateCode()
    saveWorkspace()
  })

  _resizeObserver = new ResizeObserver(() => {
    if (_workspace)
      Blockly.svgResize(_workspace)
  })
  _resizeObserver.observe(el)

  // Watch for theme changes on <html> element
  _themeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'class') {
        updateTheme()
      }
    }
  })
  _themeObserver.observe(document.documentElement, { attributes: true })

  // Initialize zoom-to-fit control
  _zoomToFit = new ZoomToFitControl(_workspace)
  _zoomToFit.init()

  Blockly.svgResize(_workspace)
  currentWorkspaceId = props.workspaceId
  loadWorkspace()
  generateCode()
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<template>
  <div ref="blocklyDiv" class="blocklyDiv" />
</template>

<style scoped>
.blocklyDiv {
  position: absolute;
  inset: 0;
}

.blocklyDiv :deep(.blocklySvg) {
  outline: none;
  border: none;
}

.blocklyDiv :deep(.blocklyMainBackground) {
  stroke: none;
}

/* Hide toolbox border/line */
.blocklyDiv :deep(.blocklyToolboxDiv) {
  border-right: none;
}

/* Fix Tailwind/Blockly conflict (issue #5840) - respect SVG display="none" */
.blocklyDiv :deep(svg[display='none']) {
  display: none !important;
}

/* Match app font stack for block text */
.blocklyDiv :deep(.blocklyText),
.blocklyDiv :deep(.blocklyFlyoutLabelText) {
  font-family:
    ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji' !important;
}
</style>

<!-- Global styles for Blockly toolbox (injected outside Vue scope) -->
<style>
.blocklyToolboxCategoryLabel {
  font-family: ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji' !important;
  font-size: 13px !important;
  font-weight: 600 !important;
}

.blocklyToolboxCategory {
  display: flex !important;
  align-items: center !important;
}

.blocklyTreeRowContentContainer {
  display: flex !important;
  align-items: center !important;
}
</style>
