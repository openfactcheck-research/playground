<script setup lang="ts">
import type { ToolbarAction } from '@/components/workspace/BlockToolbar.vue'
import { ZoomToFitControl } from '@blockly/zoom-to-fit'
import * as Blockly from 'blockly/core'
import * as En from 'blockly/msg/en'
import { pythonGenerator } from 'blockly/python'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { registerAllBlocks } from '@/blockly/blocks'
import { createTheme } from '@/blockly/theme'
import { toolboxConfig } from '@/blockly/toolbox'
import BlocklyToolbar from '@/components/workspace/BlockToolbar.vue'
import BlocklyContextMenu from '@/components/workspace/ContextMenu.vue'
import { useBlockTooltip } from '@/composables/useBlockTooltip'
import { useContextMenu } from '@/composables/useContextMenu'
import { useToolbox } from '@/composables/useToolbox'
import { useWorkspaceClipboard } from '@/composables/useWorkspaceClipboard'
import { useWorkspacePersistence } from '@/composables/useWorkspacePersistence'
import '@/blockly/styles.css'
import 'blockly/blocks'

const { workspaceId } = defineProps<{
  workspaceId: string
}>()

const emit = defineEmits<{
  codeChange: [code: string]
  blockCountChange: [count: number]
  viewportChange: [scale: number]
  trashChange: [hasContents: boolean]
  blockSelect: [info: SelectedBlockInfo | null]
  openControls: []
  openCode: [blockCode: string]
}>()

export type SelectedBlockInfo = {
  id: string
  blockType: string
  frozen: boolean
}

registerAllBlocks()
Blockly.setLocale(En as unknown as Record<string, string>)

// Events that trigger code regeneration
const SUPPORTED_EVENTS = new Set([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_MOVE,
])

// Track current workspace ID separately (changes on tab switch before prop updates)
let currentWorkspaceId = workspaceId

const blocklyDiv = ref<HTMLElement>()
let _workspace: Blockly.WorkspaceSvg | null = null
let _zoomToFit: ZoomToFitControl | null = null
let _resizeObserver: ResizeObserver | null = null
let _themeObserver: MutationObserver | null = null
let _tooltipCleanup: (() => void) | null = null

// --- Composables ---
const { saveWorkspace, loadWorkspace, getState, setState } = useWorkspacePersistence(
  () => _workspace,
  () => currentWorkspaceId,
  () => generateCode(),
)

const { copySelectedBlocks, pasteBlocks, hasSelectedBlocks, hasClipboardData } = useWorkspaceClipboard(
  () => _workspace,
  () => {
    generateCode()
    saveWorkspace()
  },
)

const {
  contextMenuVisible,
  contextMenuX,
  contextMenuY,
  contextMenuItems,
  showCustomContextMenu,
  closeContextMenu,
} = useContextMenu()

const {
  blockTooltipVisible,
  blockTooltipText,
  blockTooltipX,
  blockTooltipY,
  setupTooltipObserver,
} = useBlockTooltip()

const {
  toolboxCollapsed,
  TOOLBOX_FULL_WIDTH,
  TOOLBOX_COLLAPSED_WIDTH,
  toggleToolbox,
  applyToolboxCollapse,
  injectToolboxIcons,
} = useToolbox(() => _workspace)

// --- Toolbar state ---
const toolbarVisible = ref(false)
const toolbarX = ref(0)
const toolbarY = ref(0)
let _selectedBlockId: string | null = null
let _suppressNextDeselect = false

// --- Workspace state ---
const locked = ref(false)
const trashHasContents = ref(false)

// --- Core functions ---
function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

function updateTheme(): void {
  if (_workspace)
    _workspace.setTheme(createTheme(isDarkMode()))
}

function generateCode(): void {
  if (!_workspace)
    return
  emit('blockCountChange', _workspace.getAllBlocks(false).length)
  try {
    emit('codeChange', pythonGenerator.workspaceToCode(_workspace))
  }
  catch {
    // Expected: generator may fail for incomplete blocks
  }
}

function clearWorkspace(): void {
  if (!_workspace)
    return
  _workspace.clear()
  localStorage.removeItem(`blockly-workspace-state-${currentWorkspaceId}`)
  emit('codeChange', '')
  emit('blockCountChange', 0)
}

function toggleLock(): void {
  locked.value = !locked.value
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

function zoomIn(): void {
  _workspace?.zoomCenter(1)
}

function zoomOut(): void {
  _workspace?.zoomCenter(-1)
}
function openTrash(): void {
  if (_workspace?.trashcan)
    _workspace.trashcan.openFlyout()
}

function zoomReset(): void {
  if (!_workspace)
    return
  _workspace.setScale(1.0)
  _workspace.scrollCenter()
}

function zoomToFit(): void {
  if (_zoomToFit) {
    (_zoomToFit as any).onClick(null)
  }
}

// --- Toolbar ---
const FREEZE_REASON = 'user-freeze'

function freezeSelectedBlock(): void {
  if (!_workspace || !_selectedBlockId)
    return
  const block = _workspace.getBlockById(_selectedBlockId)
  if (!block)
    return
  block.isEnabled()
    ? block.setDisabledReason(true, FREEZE_REASON)
    : block.setDisabledReason(false, FREEZE_REASON)
  emit('blockSelect', { id: block.id, blockType: block.type, frozen: !block.isEnabled() })
  generateCode()
  saveWorkspace()
}

function updateToolbarPosition() {
  if (!_workspace || !_selectedBlockId) {
    toolbarVisible.value = false
    return
  }
  const block = _workspace.getBlockById(_selectedBlockId)
  if (!block || block.isInFlyout) {
    toolbarVisible.value = false
    return
  }
  const svgRoot = block.getSvgRoot()
  if (!svgRoot) {
    toolbarVisible.value = false
    return
  }
  const pathEl = svgRoot.querySelector<SVGPathElement>(':scope > .blocklyPath')
    || svgRoot.querySelector<SVGPathElement>(':scope > path')
  const rect = pathEl ? pathEl.getBoundingClientRect() : svgRoot.getBoundingClientRect()
  toolbarX.value = rect.left + rect.width / 2
  toolbarY.value = rect.top - 8
  toolbarVisible.value = true
}

function closeToolbar() {
  toolbarVisible.value = false
}

function handleToolbarAction(action: ToolbarAction) {
  if (!_workspace || !_selectedBlockId)
    return
  const block = _workspace.getBlockById(_selectedBlockId)
  if (!block)
    return

  if (action === 'code') {
    pythonGenerator.init(block.workspace)
    const code = pythonGenerator.blockToCode(block, true)
    const codeStr = Array.isArray(code) ? code[0] : code
    emit('openCode', codeStr || '')
  }
  else if (action === 'controls') {
    emit('openControls')
  }
  else if (action === 'menu') {
    const fakeEvent = new PointerEvent('contextmenu', {
      clientX: toolbarX.value,
      clientY: toolbarY.value + 20,
      bubbles: true,
    })
    const options = (block as any).generateContextMenu(fakeEvent)
    if (options?.length) {
      closeToolbar()
      showCustomContextMenu(fakeEvent, options)
    }
  }
}

// --- Lifecycle ---
function cleanup() {
  _tooltipCleanup?.()
  _tooltipCleanup = null
  _themeObserver?.disconnect()
  _themeObserver = null
  _resizeObserver?.disconnect()
  _resizeObserver = null
  _zoomToFit?.dispose()
  _zoomToFit = null
  if (_workspace) {
    saveWorkspace()
    _workspace.dispose()
    _workspace = null
  }
}

watch(() => workspaceId, (newId, oldId) => {
  if (!_workspace || newId === oldId)
    return
  saveWorkspace(oldId)
  currentWorkspaceId = newId
  loadWorkspace(newId)
  generateCode()
})

onMounted(() => {
  if (!blocklyDiv.value)
    return

  document.addEventListener('pointerdown', (e) => {
    _suppressNextDeselect = !!(e.target as Element).closest('[data-no-deselect]')
  }, true)

  cleanup()
  const el = blocklyDiv.value
  el.innerHTML = ''

  const dark = isDarkMode()
  _workspace = Blockly.inject(el, {
    toolbox: toolboxConfig,
    theme: createTheme(dark),
    grid: {
      spacing: 20,
      length: 2,
      colour: dark ? '#404040' : '#d4d4d4',
      snap: false,
    },
    zoom: {
      controls: false,
      wheel: true,
      startScale: 1.1,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
    },
    trashcan: true,
    move: { scrollbars: true, drag: true, wheel: true },
    sounds: true,
  })

  // Patch context menu prototypes
  Blockly.BlockSvg.prototype.showContextMenu = function (e: PointerEvent) {
    const options = this.generateContextMenu(e)
    if (options?.length)
      showCustomContextMenu(e, options)
  }
  Blockly.WorkspaceSvg.prototype.showContextMenu = function (e: PointerEvent) {
    if (this.isReadOnly() || this.isFlyout)
      return
    const options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
      { workspace: this, focusedNode: this },
      e,
    )
    if ((this as any).configureContextMenu) {
      ;(this as any).configureContextMenu(options, e)
    }
    if (options.length)
      showCustomContextMenu(e, options)
  }

  // Change listener
  _workspace.addChangeListener((event) => {
    if (!_workspace)
      return

    if (event.type === Blockly.Events.SELECTED) {
      const selEvent = event as Blockly.Events.Selected
      if (selEvent.newElementId) {
        const block = _workspace!.getBlockById(selEvent.newElementId)
        if (block && !block.isInFlyout) {
          _selectedBlockId = selEvent.newElementId
          updateToolbarPosition()
          emit('blockSelect', { id: block.id, blockType: block.type, frozen: !block.isEnabled() })
        }
        else {
          closeToolbar()
          emit('blockSelect', null)
        }
      }
      else {
        if (_suppressNextDeselect) {
          _suppressNextDeselect = false
          if (_selectedBlockId) {
            const block = _workspace!.getBlockById(_selectedBlockId)
            if (block)
              Blockly.common.setSelected(block)
          }
        }
        else {
          if (!toolbarVisible.value)
            _selectedBlockId = null
          closeToolbar()
          emit('blockSelect', null)
        }
      }
    }

    if (event.type === Blockly.Events.BLOCK_MOVE || event.type === Blockly.Events.VIEWPORT_CHANGE) {
      if (_selectedBlockId)
        updateToolbarPosition()
      if (event.type === Blockly.Events.VIEWPORT_CHANGE)
        emit('viewportChange', _workspace!.getScale())
    }

    if (event.type === Blockly.Events.BLOCK_DELETE) {
      const delEvent = event as Blockly.Events.BlockDelete
      if (delEvent.blockId === _selectedBlockId)
        closeToolbar()
      trashHasContents.value = !!(_workspace.trashcan as any)?.hasContents()
      emit('trashChange', trashHasContents.value)
    }

    if (_workspace.isDragging()) {
      toolbarVisible.value = false
      return
    }
    if (!SUPPORTED_EVENTS.has(event.type as (typeof Blockly.Events.BLOCK_CHANGE)))
      return
    generateCode()
    saveWorkspace()
  })

  _resizeObserver = new ResizeObserver(() => {
    if (_workspace)
      Blockly.svgResize(_workspace)
  })
  _resizeObserver.observe(el)

  _themeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'class')
        updateTheme()
    }
  })
  _themeObserver.observe(document.documentElement, { attributes: true })

  _zoomToFit = new ZoomToFitControl(_workspace)
  _zoomToFit.init()

  // Flyout animation patch
  const FlyoutProto = Blockly.Flyout.prototype as any
  FlyoutProto.updateDisplay = function (this: any) {
    const shouldShow = this.containerVisible ? this.isVisible() : false
    const svgEl = this.svgGroup_ as SVGGElement | null
    if (svgEl) {
      svgEl.style.display = 'block'
      svgEl.classList.toggle('flyout-open', shouldShow)
      svgEl.style.pointerEvents = shouldShow ? '' : 'none'
    }
    const sb = this.workspace_?.scrollbar
    if (sb)
      sb.setContainerVisible(shouldShow)
  }

  // Mark trashcan flyout for right-to-left animation
  const trashFlyoutSvg = (_workspace.trashcan as any)?.flyout?.svgGroup_ as SVGGElement | null
  if (trashFlyoutSvg)
    trashFlyoutSvg.classList.add('trash-flyout')

  ;(Blockly.Tooltip as any).HOVER_MS = 0
  _tooltipCleanup = setupTooltipObserver()

  Blockly.svgResize(_workspace)
  currentWorkspaceId = workspaceId
  loadWorkspace()
  generateCode()

  injectToolboxIcons(_workspace)
  toolboxCollapsed.value = true
  requestAnimationFrame(() => {
    applyToolboxCollapse(_workspace!)
    Blockly.svgResize(_workspace!)
  })
})

onBeforeUnmount(() => cleanup())

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
  freezeSelectedBlock,
  locked,
  toggleLock,
  zoomIn,
  zoomOut,
  zoomReset,
  zoomToFit,
  openTrash,
  trashHasContents,
})
</script>

<template>
  <div ref="blocklyDiv" class="blocklyDiv" :class="{ 'workspace-locked': locked }" />

  <button
    class="toolbox-toggle"
    :style="{ left: toolboxCollapsed ? `${TOOLBOX_COLLAPSED_WIDTH}px` : `${TOOLBOX_FULL_WIDTH}px` }"
    :title="toolboxCollapsed ? 'Expand toolbox' : 'Collapse toolbox'"
    @click="toggleToolbox"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :style="{ transform: toolboxCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>

  <BlocklyToolbar
    :visible="toolbarVisible"
    :x="toolbarX"
    :y="toolbarY"

    @action="handleToolbarAction"
    @close="closeToolbar"
  />

  <BlocklyContextMenu
    :items="contextMenuItems"
    :x="contextMenuX"
    :y="contextMenuY"
    :visible="contextMenuVisible"
    @close="closeContextMenu"
  />

  <div
    v-if="blockTooltipVisible && blockTooltipText"
    class="fixed z-50 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background pointer-events-none"
    :style="{ left: `${blockTooltipX}px`, top: `${blockTooltipY}px` }"
  >
    {{ blockTooltipText }}
  </div>
</template>

<style scoped>
.blocklyDiv {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.blocklyDiv.workspace-locked :deep(.blocklyBlockCanvas),
.blocklyDiv.workspace-locked :deep(.blocklyBubbleCanvas) {
  pointer-events: none;
}

.blocklyDiv :deep(.zoomToFit) {
  display: none;
}
.blocklyDiv :deep(.blocklyTrash) {
  display: none;
}

.blocklyDiv :deep(.blocklySvg) {
  outline: none;
  border: none;
}

.blocklyDiv :deep(.blocklyMainBackground) {
  stroke: none;
  cursor: grab;
}

.blocklyDiv :deep(.blocklyMainBackground:active) {
  cursor: grabbing;
}

/* Toolbox collapse/expand */
.blocklyDiv :deep(.blocklyToolbox) {
  z-index: 10 !important;
  overflow: hidden;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.blocklyDiv :deep(.blocklyToolboxCategoryLabel) {
  overflow: hidden;
  max-width: 200px;
  opacity: 1;
  transition:
    max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.blocklyDiv :deep(.blocklyToolbox.toolbox-collapsed .blocklyToolboxCategoryLabel) {
  max-width: 0;
  opacity: 0;
}

.blocklyDiv :deep(.blocklyToolbox.toolbox-collapsed .blocklyToolboxCategory) {
  padding-right: 0 !important;
}

.blocklyDiv :deep(.blocklyToolboxCategory) {
  overflow: hidden;
  border-left-width: 12px !important;
}

.blocklyDiv :deep(.blocklyTreeRowContentContainer) {
  transition:
    gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    padding-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.blocklyDiv :deep(.blocklyToolbox.toolbox-collapsed .blocklyTreeRowContentContainer) {
  gap: 0 !important;
  padding-left: 10px !important;
  padding-right: 10px !important;
}

.blocklyDiv :deep(.blocklyToolboxCategoryIcon) {
  visibility: visible !important;
  background-image: none !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
  flex-shrink: 0;
}

.blocklyDiv :deep(.blocklyToolbox.toolbox-collapsed .blocklyToolboxCategoryIcon) {
  margin: 0 !important;
}

.blocklyDiv :deep(.blocklyTreeSeparator) {
  transition: margin 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.blocklyDiv :deep(.blocklyToolbox.toolbox-collapsed .blocklyTreeSeparator) {
  margin: 6px 10px !important;
}

/* Toolbox toggle button */
.toolbox-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 28px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  color: var(--muted-foreground);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s,
    left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.blocklyDiv:hover ~ .toolbox-toggle,
.toolbox-toggle:hover {
  opacity: 1;
}

.toolbox-toggle:hover {
  color: var(--foreground);
  background: var(--accent);
}

/* Flyout animation */
.blocklyDiv :deep(.blocklyFlyout) {
  z-index: 10 !important;
  clip-path: inset(0 100% 0 0);
  opacity: 0;
  transition:
    clip-path 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease-out;
  pointer-events: none;
}

.blocklyDiv :deep(.blocklyFlyout.flyout-open) {
  clip-path: inset(0 0 0 0);
  opacity: 1;
  pointer-events: auto;
}

.blocklyDiv :deep(.blocklyFlyout.trash-flyout) {
  clip-path: inset(0 0 0 100%);
}

.blocklyDiv :deep(.blocklyFlyout.trash-flyout.flyout-open) {
  clip-path: inset(0 0 0 0);
}

.blocklyDiv :deep(.blocklyWidgetDiv),
.blocklyDiv :deep(.blocklyDropDownDiv),
.blocklyDiv :deep(.blocklyTooltipDiv) {
  z-index: 40 !important;
}

/* Fix Tailwind/Blockly conflict (issue #5840) */
.blocklyDiv :deep(svg[display='none']) {
  display: none !important;
}
</style>
