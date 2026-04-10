<script setup lang="ts">
import type { StickyNoteData } from '@/composables/useWorkspaceNotes'
import { marked } from 'marked'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  note: StickyNoteData
  scale: number
  selected: boolean
}>()

const emit = defineEmits<{
  update: [id: string, changes: Partial<StickyNoteData>]
  select: [id: string]
}>()

const editing = ref(false)
const editText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

const renderedHtml = computed(() => {
  if (!props.note.text.trim()) {
    return ''
  }
  return marked.parse(props.note.text, { async: false }) as string
})

function startEdit(): void {
  editText.value = props.note.text
  editing.value = true
  nextTick(() => textareaRef.value?.focus())
}

function finishEdit(): void {
  editing.value = false
  if (editText.value !== props.note.text) {
    emit('update', props.note.id, { text: editText.value })
  }
}

// --- Drag ---
let dragStartX = 0
let dragStartY = 0
let dragNoteStartX = 0
let dragNoteStartY = 0

function onDragStart(e: PointerEvent): void {
  if (editing.value) {
    return
  }
  e.preventDefault()
  e.stopPropagation()
  emit('select', props.note.id)
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragNoteStartX = props.note.x
  dragNoteStartY = props.note.y
  document.addEventListener('pointermove', onDragMove, true)
  document.addEventListener('pointerup', onDragEnd, true)
}

function onDragMove(e: PointerEvent): void {
  const dx = (e.clientX - dragStartX) / props.scale
  const dy = (e.clientY - dragStartY) / props.scale
  emit('update', props.note.id, {
    x: dragNoteStartX + dx,
    y: dragNoteStartY + dy,
  })
}

function onDragEnd(): void {
  document.removeEventListener('pointermove', onDragMove, true)
  document.removeEventListener('pointerup', onDragEnd, true)
}

// --- Resize ---
let resizeStartX = 0
let resizeStartY = 0
let resizeNoteStartW = 0
let resizeNoteStartH = 0

function onResizeStart(e: PointerEvent): void {
  e.preventDefault()
  e.stopPropagation()
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  resizeNoteStartW = props.note.width
  resizeNoteStartH = props.note.height
  document.addEventListener('pointermove', onResizeMove, true)
  document.addEventListener('pointerup', onResizeEnd, true)
}

function onResizeMove(e: PointerEvent): void {
  const dw = (e.clientX - resizeStartX) / props.scale
  const dh = (e.clientY - resizeStartY) / props.scale
  emit('update', props.note.id, {
    width: Math.max(150, resizeNoteStartW + dw),
    height: Math.max(100, resizeNoteStartH + dh),
  })
}

function onResizeEnd(): void {
  document.removeEventListener('pointermove', onResizeMove, true)
  document.removeEventListener('pointerup', onResizeEnd, true)
}

onBeforeUnmount(() => {
  onDragEnd()
  onResizeEnd()
})

// Close editing if note gets deselected while editing
watch(() => props.selected, (sel) => {
  if (!sel && editing.value) {
    finishEdit()
  }
})
</script>

<template>
  <div
    class="sticky-note"
    :class="{ 'sticky-note--selected': selected }"
    :data-color="note.color"
    :style="{
      left: `${note.x}px`,
      top: `${note.y}px`,
      width: `${note.width}px`,
      height: `${note.height}px`,
    }"
    @pointerdown="onDragStart"
    @click.stop="emit('select', note.id)"
  >
    <!-- Edit mode -->
    <textarea
      v-if="editing"
      ref="textareaRef"
      v-model="editText"
      class="sticky-note-editor"
      placeholder="Write markdown here..."
      @blur="finishEdit"
      @pointerdown.stop
      @keydown.escape="finishEdit"
    />

    <!-- View mode -->
    <div
      v-else
      class="sticky-note-content"
      @dblclick.stop="startEdit"
    >
      <div
        v-if="renderedHtml"
        class="sticky-note-markdown"
        v-html="renderedHtml"
      />
      <span v-else class="sticky-note-placeholder">
        Double-click to edit · Supports Markdown
      </span>
    </div>

    <!-- Resize handle -->
    <div
      class="sticky-note-resize"
      @pointerdown="onResizeStart"
    />
  </div>
</template>

<style scoped>
/* Light mode */
:global(.sticky-note[data-color='yellow']) {
  --n-fill: #fde68a;
  --n-border: #fde68a;
  --n-text: #000000;
}
:global(.sticky-note[data-color='gray']) {
  --n-fill: #e4e4e7;
  --n-border: #e4e4e7;
  --n-text: #000000;
}
:global(.sticky-note[data-color='pink']) {
  --n-fill: #fecdd3;
  --n-border: #fecdd3;
  --n-text: #000000;
}
:global(.sticky-note[data-color='blue']) {
  --n-fill: #bfdbfe;
  --n-border: #bfdbfe;
  --n-text: #000000;
}
:global(.sticky-note[data-color='green']) {
  --n-fill: #d9f99d;
  --n-border: #d9f99d;
  --n-text: #000000;
}
:global(.sticky-note[data-color='transparent']) {
  --n-fill: transparent;
  --n-border: transparent;
  --n-text: #000000;
}

/* Dark mode */
:global(.dark .sticky-note[data-color='yellow']) {
  --n-fill: #fcd44c;
  --n-border: #fcd44c;
  --n-text: #000000;
}
:global(.dark .sticky-note[data-color='gray']) {
  --n-fill: #d4d4d8;
  --n-border: #d4d4d8;
  --n-text: #000000;
}
:global(.dark .sticky-note[data-color='pink']) {
  --n-fill: #fda4af;
  --n-border: #fda4af;
  --n-text: #000000;
}
:global(.dark .sticky-note[data-color='blue']) {
  --n-fill: #92c5fd;
  --n-border: #92c5fd;
  --n-text: #000000;
}
:global(.dark .sticky-note[data-color='green']) {
  --n-fill: #bef363;
  --n-border: #bef363;
  --n-text: #000000;
}
:global(.dark .sticky-note[data-color='transparent']) {
  --n-fill: transparent;
  --n-border: transparent;
  --n-text: #ffffff;
}

.sticky-note {
  position: absolute;
  border-radius: 8px;
  border: 1.5px solid var(--n-border);
  background-color: var(--n-fill);
  color: var(--n-text);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
  cursor: grab;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.sticky-note:active {
  cursor: grabbing;
}

.sticky-note--selected {
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.15),
    0 2px 12px rgba(0, 0, 0, 0.1);
}

:global(.dark) .sticky-note--selected {
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.2),
    0 2px 12px rgba(0, 0, 0, 0.3);
}

/* Editor textarea */
.sticky-note-editor {
  flex: 1;
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  padding: 4px 8px 8px;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  cursor: text;
}

.sticky-note-editor::placeholder {
  opacity: 0.4;
}

/* Content view */
.sticky-note-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 8px;
  cursor: default;
  min-height: 0;
}

.sticky-note-placeholder {
  opacity: 0.4;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 12px;
  font-style: italic;
  user-select: none;
}

/* Markdown styling */
.sticky-note-markdown {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
}

.sticky-note-markdown :deep(h1) {
  font-size: 1.3em;
  font-weight: 600;
  margin: 0.4em 0;
}
.sticky-note-markdown :deep(h2) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 0.3em 0;
}
.sticky-note-markdown :deep(h3) {
  font-size: 1em;
  font-weight: 600;
  margin: 0.2em 0;
}
.sticky-note-markdown :deep(p) {
  margin: 0.3em 0;
}
.sticky-note-markdown :deep(ul),
.sticky-note-markdown :deep(ol) {
  padding-left: 1.5em;
  margin: 0.3em 0;
}
.sticky-note-markdown :deep(li) {
  margin: 0.15em 0;
}
.sticky-note-markdown :deep(code) {
  background: rgba(128, 128, 128, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Geist Mono', monospace;
}
.sticky-note-markdown :deep(pre) {
  background: rgba(128, 128, 128, 0.1);
  padding: 4px 8px 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.3em 0;
}
.sticky-note-markdown :deep(pre code) {
  background: none;
  padding: 0;
}
.sticky-note-markdown :deep(blockquote) {
  border-left: 3px solid currentColor;
  padding-left: 8px;
  margin: 0.3em 0;
  opacity: 0.7;
}
.sticky-note-markdown :deep(a) {
  text-decoration: underline;
}
.sticky-note-markdown :deep(strong) {
  font-weight: 600;
}
.sticky-note-markdown :deep(em) {
  font-style: italic;
}
.sticky-note-markdown :deep(hr) {
  border: none;
  border-top: 1px solid currentColor;
  margin: 0.5em 0;
  opacity: 0.2;
}

.sticky-note-markdown :deep(> *:first-child) {
  margin-top: 0;
}

.sticky-note-markdown :deep(> *:last-child) {
  margin-bottom: 0;
}

:global(.sticky-note[data-color='transparent']) {
  box-shadow: none;
}

:global(.sticky-note[data-color='transparent'].sticky-note--selected) {
  box-shadow: none;
}

/* Resize handle */
.sticky-note-resize {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  cursor: se-resize;
  opacity: 0;
  transition: opacity 0.1s;
}

.sticky-note-resize::before {
  content: '';
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  opacity: 0.3;
}

.sticky-note:hover .sticky-note-resize {
  opacity: 1;
}
</style>
