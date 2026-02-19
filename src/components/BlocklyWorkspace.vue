<script setup lang="ts">
import * as Blockly from 'blockly/core'
import * as En from 'blockly/msg/en'
import { pythonGenerator } from 'blockly/python'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { registerAllBlocks } from '@/blockly/blocks'
import { setInputText } from '@/blockly/blocks/claimInput'
import { createTheme } from '@/blockly/theme'
import { toolboxConfig } from '@/blockly/toolbox'
import '@/blockly/styles.css'
import 'blockly/blocks'

const props = defineProps<{
  inputText?: string
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

const WORKSPACE_STORAGE_KEY = 'blockly-workspace-state'

Blockly.setLocale(En as unknown as Record<string, string>)

const blocklyDiv = ref<HTMLElement>()

// Store workspace outside of Vue reactivity to prevent proxy issues
// and ensure cleanup survives HMR cycles
let _workspace: Blockly.WorkspaceSvg | null = null
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
  try {
    const code = pythonGenerator.workspaceToCode(_workspace)
    emit('codeChange', code)
    emit('blockCountChange', getBlockCount())
  }
  catch {
    // Expected: generator may fail for incomplete blocks (e.g., empty inputs)
  }
}

function clearWorkspace(): void {
  if (!_workspace)
    return
  _workspace.clear()
  localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  emit('codeChange', '')
  emit('blockCountChange', 0)
}

function undo(): void {
  _workspace?.undo(false)
}

function redo(): void {
  _workspace?.undo(true)
}

function resize(): void {
  if (_workspace)
    Blockly.svgResize(_workspace)
}

function saveWorkspace(): void {
  if (!_workspace)
    return
  try {
    const state = Blockly.serialization.workspaces.save(_workspace)
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // Ignore serialization errors
  }
}

function loadWorkspace(): void {
  if (!_workspace)
    return
  try {
    const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      Blockly.serialization.workspaces.load(state, _workspace)
    }
  }
  catch {
    // Ignore deserialization errors, start fresh
    localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  }
}

defineExpose({ clearWorkspace, undo, redo, resize, saveWorkspace, loadWorkspace })

// Watch for input text changes and regenerate code
watch(() => props.inputText, (newText) => {
  setInputText(newText ?? '')
  generateCode()
}, { immediate: true })

function cleanup() {
  if (_themeObserver) {
    _themeObserver.disconnect()
    _themeObserver = null
  }
  if (_resizeObserver) {
    _resizeObserver.disconnect()
    _resizeObserver = null
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

  Blockly.svgResize(_workspace)
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
