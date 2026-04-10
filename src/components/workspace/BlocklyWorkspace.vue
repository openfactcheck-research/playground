<script setup lang="ts">
import type { ToolbarAction } from '@/components/workspace/BlockToolbar.vue'
import type { NoteColor } from '@/composables/useWorkspaceNotes'
import { ZoomToFitControl } from '@blockly/zoom-to-fit'
import * as Blockly from 'blockly/core'
import { getFocusManager } from 'blockly/core'
import * as En from 'blockly/msg/en'
import { pythonGenerator } from 'blockly/python'
import { ChevronLeft } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { registerAllBlocks } from '@/blockly/blocks'
import { setVerbose as setTextInputVerbose, BLOCK_TYPE as TEXT_INPUT_TYPE } from '@/blockly/blocks/textInput'
import { openPrompt } from '@/blockly/dialogs/urlPromptBridge'
import { createTheme } from '@/blockly/theme'
import { toolboxConfig } from '@/blockly/toolbox'
import BlocklyToolbar from '@/components/workspace/BlockToolbar.vue'
import BlocklyContextMenu from '@/components/workspace/ContextMenu.vue'
import NoteToolbar from '@/components/workspace/NoteToolbar.vue'
import StickyNote from '@/components/workspace/StickyNote.vue'
import { useBlockTooltip } from '@/composables/useBlockTooltip'
import { useContextMenu } from '@/composables/useContextMenu'
import { useProjects } from '@/composables/useProjects'
import { useToolbox } from '@/composables/useToolbox'
import { useVerboseMode } from '@/composables/useVerboseMode'
import { useWorkspaceClipboard } from '@/composables/useWorkspaceClipboard'
import { useWorkspaceNotes } from '@/composables/useWorkspaceNotes'
import { useWorkspacePersistence } from '@/composables/useWorkspacePersistence'
import '@/blockly/styles.css'
import 'blockly/blocks'

const props = defineProps<{
  projectId: string
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
let currentWorkspaceId = props.workspaceId

const blocklyDiv = ref<HTMLElement>()
let _workspace: Blockly.WorkspaceSvg | null = null
let _zoomToFit: ZoomToFitControl | null = null
let _resizeObserver: ResizeObserver | null = null
let _themeObserver: MutationObserver | null = null

// --- API content persistence ---
const { getWorkspace: getWsFromCache, saveWorkspaceContent } = useProjects()

const _notesContainer = { get: (): import('@/types/projects').StickyNote[] => [] }

let _saveTimer: ReturnType<typeof setTimeout> | null = null
let _dirty = false
const SAVE_DEBOUNCE_MS = 10_000

function debouncedSave(): void {
  _dirty = true
  if (_saveTimer)
    clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => flushSave(), SAVE_DEBOUNCE_MS)
}

function flushSave(): void {
  if (_saveTimer) {
    clearTimeout(_saveTimer)
    _saveTimer = null
  }
  if (!_dirty)
    return
  _dirty = false
  const workspace = _workspace
  if (!workspace)
    return
  try {
    const blockly = Blockly.serialization.workspaces.save(workspace)
    saveWorkspaceContent(props.projectId, currentWorkspaceId, { blockly, notes: _notesContainer.get() })
  }
  catch {
    // Ignore serialization errors
  }
}
let _tooltipCleanup: (() => void) | null = null

// --- Composables ---
const { saveWorkspace, loadWorkspace, getState: getBlocklyState, setState: setBlocklyState } = useWorkspacePersistence(
  () => _workspace,
  () => generateCode(),
  () => debouncedSave(),
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

// --- Notes ---
const notesCanvasRef = ref<HTMLElement>()
const currentScale = ref(1)
const selectedNoteId = ref<string | null>(null)
const { notes, loadNotes, addNote: createNote, deleteNote, updateNote } = useWorkspaceNotes(() => debouncedSave())
_notesContainer.get = () => notes.value

// --- Note toolbar state ---
const noteToolbarVisible = ref(false)
const noteToolbarX = ref(0)
const noteToolbarY = ref(0)
const noteToolbarColor = ref<NoteColor>('yellow')

let _suppressNextDeselect = false
let _returnEphemeralFocus: (() => void) | null = null

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
  notes.value = []
  flushSave()
  selectedNoteId.value = null
  closeNoteToolbar()
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

function addNote(): void {
  if (!_workspace)
    return
  const metrics = _workspace.getMetrics()
  const wsX = (metrics.viewLeft + metrics.viewWidth / 2 - 125) / _workspace.scale
  const wsY = (metrics.viewTop + metrics.viewHeight / 2 - 100) / _workspace.scale
  const id = createNote(wsX, wsY)
  selectedNoteId.value = id
  updateNoteToolbarForNote(id)
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

// --- Note toolbar ---
function updateNoteToolbarForNote(noteId: string): void {
  const note = notes.value.find(n => n.id === noteId)
  if (!note || !notesCanvasRef.value) {
    noteToolbarVisible.value = false
    return
  }
  const canvas = notesCanvasRef.value
  const scale = currentScale.value
  const origin = _workspace ? _workspace.getOriginOffsetInPixels() : { x: 0, y: 0 }
  const parentRect = canvas.parentElement!.getBoundingClientRect()

  const screenX = parentRect.left + origin.x + note.x * scale
  const screenY = parentRect.top + origin.y + note.y * scale
  const screenW = note.width * scale

  noteToolbarX.value = screenX + screenW / 2
  noteToolbarY.value = screenY - 8
  noteToolbarColor.value = note.color
  noteToolbarVisible.value = true
}

function closeNoteToolbar(): void {
  noteToolbarVisible.value = false
}

function handleNoteColor(color: NoteColor): void {
  if (!selectedNoteId.value) {
    return
  }
  updateNote(selectedNoteId.value, { color })
  noteToolbarColor.value = color
}

function handleNoteMenu(): void {
  if (!selectedNoteId.value) {
    return
  }
  deleteNote(selectedNoteId.value)
  selectedNoteId.value = null
  closeNoteToolbar()
}

function handleNoteUpdate(id: string, changes: Partial<import('@/composables/useWorkspaceNotes').StickyNoteData>): void {
  updateNote(id, changes)
  if (id === selectedNoteId.value) {
    updateNoteToolbarForNote(id)
  }
}

function handleNoteSelect(id: string): void {
  // Deselect any Blockly block — setSelected(null) has a Blockly bug where it
  // calls null.canBeFocused() in the focus manager, so guard with try/catch.
  if (_workspace) {
    try {
      Blockly.common.setSelected(null as any)
    }
    catch {}
  }
  _selectedBlockId = null
  closeToolbar()
  emit('blockSelect', null)

  selectedNoteId.value = id
  const note = notes.value.find(n => n.id === id)
  if (note) {
    noteToolbarColor.value = note.color
  }
  updateNoteToolbarForNote(id)
}

/** Convert screen coordinates to workspace coordinates and find a note under the cursor. */
function findNoteAtScreenPoint(clientX: number, clientY: number): string | null {
  if (!_workspace || !notesCanvasRef.value) {
    return null
  }
  const parent = notesCanvasRef.value.parentElement
  if (!parent) {
    return null
  }
  const parentRect = parent.getBoundingClientRect()
  const origin = _workspace.getOriginOffsetInPixels()
  const scale = _workspace.getScale()
  // Convert screen → workspace coordinates
  const wsX = (clientX - parentRect.left - origin.x) / scale
  const wsY = (clientY - parentRect.top - origin.y) / scale
  // Check notes in reverse order (topmost first)
  for (let i = notes.value.length - 1; i >= 0; i--) {
    const n = notes.value[i]!
    if (wsX >= n.x && wsX <= n.x + n.width && wsY >= n.y && wsY <= n.y + n.height) {
      return n.id
    }
  }
  return null
}

function updateNotesTransform(): void {
  if (!_workspace || !notesCanvasRef.value) {
    return
  }
  const origin = _workspace.getOriginOffsetInPixels()
  const scale = _workspace.getScale()
  currentScale.value = scale
  notesCanvasRef.value.style.transform = `translate(${origin.x}px, ${origin.y}px) scale(${scale})`
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
    flushSave()
    _workspace.dispose()
    _workspace = null
  }
}

watch(() => props.workspaceId, (newId, oldId) => {
  if (!_workspace || newId === oldId)
    return
  // Flush save for old workspace
  flushSave()
  selectedNoteId.value = null
  closeNoteToolbar()
  currentWorkspaceId = newId
  // Load new workspace content from API cache
  const ws = getWsFromCache(props.projectId, newId)
  loadWorkspace(ws?.content?.blockly)
  loadNotes(ws?.content?.notes)
  applyVerboseToAll()
  generateCode()
  requestAnimationFrame(() => updateNotesTransform())
})

onMounted(() => {
  if (!blocklyDiv.value)
    return

  Blockly.dialog.setPrompt(openPrompt)

  document.addEventListener('pointerdown', (e) => {
    const target = e.target as Element
    const inNoDeselect = !!target.closest('[data-no-deselect]')
    _suppressNextDeselect = inNoDeselect
    // Release ephemeral focus synchronously before Blockly processes the event.
    // If released only inside the async change listener, Safari's gesture manager
    // can see it as still held during gesture disposal, leaving a stuck gesture
    // that causes "gesture had already been started" on the next block click.
    if (!inNoDeselect && _returnEphemeralFocus) {
      const rf = _returnEphemeralFocus
      _returnEphemeralFocus = null
      rf()
    }
  }, true)

  document.addEventListener('focusin', (e) => {
    const target = e.target as Element
    const inNoDeselect = !!target?.closest('[data-no-deselect]')
    if (inNoDeselect)
      e.stopImmediatePropagation()
  }, true)

  document.addEventListener('focusout', (e) => {
    const relatedTarget = e.relatedTarget as Element | null
    const leavingNoDeselect = !relatedTarget || !relatedTarget.closest('[data-no-deselect]')
    if (leavingNoDeselect && _returnEphemeralFocus) {
      const rf = _returnEphemeralFocus
      _returnEphemeralFocus = null
      rf()
    }
  }, true)

  cleanup()
  const el = blocklyDiv.value
  el.innerHTML = ''

  const dark = isDarkMode()
  _workspace = Blockly.inject(el, {
    toolbox: toolboxConfig,
    theme: createTheme(dark),
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

  // Intercept clicks on workspace background that hit a note behind the SVG.
  // Notes are at z-index: 0 (visually behind blocks at z-index: 1), so the
  // SVG captures pointer events first. Detect clicks on the background that
  // overlap a note and redirect them.
  const svgEl = (el.querySelector('.blocklySvg') ?? el) as HTMLElement
  svgEl.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = e.target as SVGElement
    // Only intercept clicks on the workspace background, not on blocks
    if (!target.classList.contains('blocklyMainBackground')) {
      return
    }
    const noteId = findNoteAtScreenPoint(e.clientX, e.clientY)
    if (!noteId) {
      // Clicked empty workspace — deselect any active note
      if (selectedNoteId.value) {
        selectedNoteId.value = null
        closeNoteToolbar()
      }
      return
    }
    e.stopPropagation()
    e.preventDefault()
    handleNoteSelect(noteId)
  }, true)

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
        // Release ephemeral focus if held (e.g. user clicks a different block
        // directly without first deselecting — same Safari issue applies).
        if (_returnEphemeralFocus) {
          const rf = _returnEphemeralFocus
          _returnEphemeralFocus = null
          rf()
        }
        const block = _workspace!.getBlockById(selEvent.newElementId)
        if (block && !block.isInFlyout) {
          _selectedBlockId = selEvent.newElementId
          selectedNoteId.value = null
          closeNoteToolbar()
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
            if (block) {
              // Take ephemeral focus BEFORE setSelected so focusNode() inside
              // setSelected skips activelyFocusNode (no SVG.focus() call).
              // Without this, SVG gets focus → target.focus() causes focusout
              // from SVG → onNodeBlur → batched SELECTED(null) that slips past
              // the now-cleared suppress flag.
              if (!_returnEphemeralFocus) {
                try {
                  const fm = getFocusManager()
                  if (!fm.ephemeralFocusTaken()) {
                    _returnEphemeralFocus = fm.takeEphemeralFocus(
                      (document.activeElement as HTMLElement) ?? document.body,
                    )
                  }
                }
                catch (err) { console.warn('[suppress] takeEphemeralFocus failed:', err) }
              }
              Blockly.common.setSelected(block)
            }
          }
        }
        else {
          // Safari doesn't focus SVG elements, so clicking the workspace never
          // triggers focusout from a textarea — ephemeral focus would stay held
          // forever. Release it here on any genuine (non-suppressed) deselect.
          if (_returnEphemeralFocus) {
            const rf = _returnEphemeralFocus
            _returnEphemeralFocus = null
            rf()
          }
          if (!toolbarVisible.value)
            _selectedBlockId = null
          closeToolbar()
          selectedNoteId.value = null
          closeNoteToolbar()
          emit('blockSelect', null)
        }
      }
    }

    if (event.type === Blockly.Events.BLOCK_MOVE || event.type === Blockly.Events.VIEWPORT_CHANGE) {
      if (_selectedBlockId)
        updateToolbarPosition()
      if (event.type === Blockly.Events.VIEWPORT_CHANGE) {
        updateNotesTransform()
        if (selectedNoteId.value) {
          updateNoteToolbarForNote(selectedNoteId.value)
        }
        emit('viewportChange', _workspace!.getScale())
      }
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
      noteToolbarVisible.value = false
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
  currentWorkspaceId = props.workspaceId
  // Load content from API cache
  const ws = getWsFromCache(props.projectId, props.workspaceId)
  loadWorkspace(ws?.content?.blockly)
  loadNotes(ws?.content?.notes)
  generateCode()
  requestAnimationFrame(() => updateNotesTransform())

  injectToolboxIcons(_workspace)
  toolboxCollapsed.value = true
  requestAnimationFrame(() => {
    applyToolboxCollapse(_workspace!)
    Blockly.svgResize(_workspace!)
  })
})

const _onOpenControls = () => emit('openControls')
onMounted(() => window.addEventListener('blockly:open-controls', _onOpenControls))

function handleKeyDown(e: KeyboardEvent): void {
  if (!selectedNoteId.value)
    return
  if (e.key !== 'Delete' && e.key !== 'Backspace')
    return
  const tag = (document.activeElement as HTMLElement)?.tagName
  if (tag === 'TEXTAREA' || tag === 'INPUT')
    return
  e.preventDefault()
  deleteNote(selectedNoteId.value)
  selectedNoteId.value = null
  closeNoteToolbar()
}

onMounted(() => document.addEventListener('keydown', handleKeyDown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('blockly:open-controls', _onOpenControls)
  cleanup()
})

const { verboseMode } = useVerboseMode(() => props.projectId, () => props.workspaceId)

function applyVerboseToAll() {
  if (!_workspace)
    return
  const verbose = verboseMode.value
  for (const block of _workspace.getAllBlocks(false)) {
    if (block.type === TEXT_INPUT_TYPE) {
      setTextInputVerbose(block, verbose)
    }
  }
}

watch(verboseMode, () => applyVerboseToAll())

defineExpose({
  clearWorkspace,
  undo,
  redo,
  addNote,
  resize,
  saveWorkspace,
  loadWorkspace,
  getState: () => ({ blocks: getBlocklyState(), notes: notes.value }),
  setState: (data: any) => {
    if (data?.blocks) {
      setBlocklyState(data.blocks)
    }
    else {
      // Backwards compat: old exports have workspace state at top level
      setBlocklyState(data)
    }
    if (data?.notes) {
      notes.value = data.notes
      flushSave()
    }
  },
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
  getBlockById: (id: string) => _workspace?.getBlockById(id) ?? null,
})
</script>

<template>
  <div ref="blocklyDiv" class="blocklyDiv" :class="{ 'workspace-locked': locked }" />

  <!-- Custom notes overlay — below blocks by default, above when a note is selected -->
  <div class="notes-layer" :class="{ 'notes-layer--active': selectedNoteId !== null }">
    <div ref="notesCanvasRef" class="notes-canvas">
      <StickyNote
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :scale="currentScale"
        :selected="selectedNoteId === note.id"
        @update="handleNoteUpdate"
        @select="handleNoteSelect"
      />
    </div>
  </div>

  <button
    class="toolbox-toggle"
    :style="{ left: toolboxCollapsed ? `${TOOLBOX_COLLAPSED_WIDTH}px` : `${TOOLBOX_FULL_WIDTH}px` }"
    :title="toolboxCollapsed ? 'Expand toolbox' : 'Collapse toolbox'"
    @click="toggleToolbox"
  >
    <ChevronLeft
      :size="14"
      :style="{ transform: toolboxCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }"
    />
  </button>

  <BlocklyToolbar
    :visible="toolbarVisible"
    :x="toolbarX"
    :y="toolbarY"

    @action="handleToolbarAction"
    @close="closeToolbar"
  />

  <NoteToolbar
    :visible="noteToolbarVisible"
    :x="noteToolbarX"
    :y="noteToolbarY"
    :active-color="noteToolbarColor"
    @set-color="handleNoteColor"
    @menu="handleNoteMenu"
    @close="closeNoteToolbar"
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

.notes-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.notes-layer--active {
  z-index: 2;
}

.notes-canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  pointer-events: none;
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
  background-color: transparent !important;
}

.blocklyDiv :deep(.blocklyMainBackground) {
  stroke: none;
  cursor: grab;
  fill: transparent;
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
  color: var(--primary-foreground);
  background: var(--primary);
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
