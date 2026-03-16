<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'

export type WorkspaceTab = {
  id: string
  name: string
}

const props = defineProps<{
  tabs: WorkspaceTab[]
  activeTabId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  close: [id: string]
  rename: [id: string, name: string]
  reorder: [orderedIds: string[]]
}>()

const editingTabId = ref<string | null>(null)
const editingName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

async function startRename(tabId: string, currentName: string) {
  editingTabId.value = tabId
  editingName.value = currentName
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function resetRename() {
  editingTabId.value = null
  editingName.value = ''
}

function finishRename() {
  if (editingTabId.value && editingName.value.trim())
    emit('rename', editingTabId.value, editingName.value.trim())
  resetRename()
}

// -- Pointer-based drag and drop --
const containerRef = ref<HTMLElement | null>(null)
const dragTabId = ref<string | null>(null)
const dragDeltaX = ref(0)
const insertIdx = ref(-1)

// Cache tab rects at drag start
let tabRects: { id: string, left: number, width: number, midX: number }[] = []
let startX = 0
let dragOrigIdx = -1

function onPointerDown(e: PointerEvent, tabId: string) {
  // Only left-click, skip if renaming
  if (e.button !== 0 || editingTabId.value)
    return

  const container = containerRef.value
  if (!container)
    return

  // Build rect cache
  const buttons = Array.from(container.querySelectorAll<HTMLElement>('[data-tab-id]'))
  tabRects = buttons.map((btn) => {
    const r = btn.getBoundingClientRect()
    return { id: btn.dataset.tabId!, left: r.left, width: r.width, midX: r.left + r.width / 2 }
  })

  startX = e.clientX
  dragOrigIdx = tabRects.findIndex(t => t.id === tabId)
  dragTabId.value = null
  dragDeltaX.value = 0
  insertIdx.value = dragOrigIdx

  // Listen on document so drag works outside the tab
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (dragOrigIdx === -1)
    return
  const dx = e.clientX - startX

  // Start drag after 4px threshold
  if (!dragTabId.value) {
    if (Math.abs(dx) < 4)
      return
    dragTabId.value = tabRects[dragOrigIdx]!.id
  }

  dragDeltaX.value = dx

  // Determine insert position based on dragged tab's current center
  const draggedMid = tabRects[dragOrigIdx]!.midX + dx
  let newIdx = tabRects.length - 1
  for (let i = 0; i < tabRects.length; i++) {
    if (draggedMid < tabRects[i]!.midX) {
      newIdx = i
      break
    }
  }
  insertIdx.value = newIdx
}

function onPointerUp() {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)

  const wasDragging = dragTabId.value
  const finalIdx = insertIdx.value

  if (wasDragging && finalIdx !== dragOrigIdx) {
    const ids = props.tabs.map(t => t.id)
    const [moved] = ids.splice(dragOrigIdx, 1)
    ids.splice(finalIdx > dragOrigIdx ? finalIdx - 1 : finalIdx, 0, moved!)
    emit('reorder', ids)
  }

  dragTabId.value = null
  dragDeltaX.value = 0
  insertIdx.value = -1
  dragOrigIdx = -1
  tabRects = []
}

onUnmounted(() => {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
})

// Compute shift for non-dragged tabs
function tabShift(tabId: string, index: number): number {
  if (!dragTabId.value || tabId === dragTabId.value)
    return 0
  const dragWidth = tabRects[dragOrigIdx]?.width ?? 0

  // Tabs between old and new position need to shift
  if (insertIdx.value <= dragOrigIdx) {
    // Dragging left: tabs in [insertIdx, dragOrigIdx) shift right
    if (index >= insertIdx.value && index < dragOrigIdx)
      return dragWidth + 4
  }
  else {
    // Dragging right: tabs in (dragOrigIdx, insertIdx) shift left
    if (index > dragOrigIdx && index < insertIdx.value)
      return -(dragWidth + 4)
  }
  return 0
}
</script>

<template>
  <div ref="containerRef" class="flex w-full items-center border-b border-border bg-muted/30 px-2 py-1.5 gap-1">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      :data-tab-id="tab.id"
      class="group relative flex flex-1 min-w-0 items-center justify-center rounded-lg py-1.5 text-sm select-none"
      :class="[
        tab.id === activeTabId
          ? 'bg-background dark:bg-muted text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        dragTabId === tab.id ? 'z-10 shadow-lg scale-[1.03]' : '',
        dragTabId && dragTabId !== tab.id ? 'transition-transform duration-200 ease-out' : '',
      ]"
      :style="{
        transform: dragTabId === tab.id
          ? `translateX(${dragDeltaX}px)`
          : `translateX(${tabShift(tab.id, index)}px)`,
        opacity: dragTabId === tab.id ? 0.85 : 1,
      }"
      @click="!dragTabId && emit('select', tab.id)"
      @dblclick.stop="startRename(tab.id, tab.name)"
      @pointerdown="onPointerDown($event, tab.id)"
      @dragstart.prevent
    >
      <!-- Close button — absolute, left corner, appears on hover -->
      <span
        class="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full w-4 h-4 transition-opacity hover:bg-destructive/20 hover:text-destructive"
        :class="tab.id === activeTabId ? 'opacity-30 group-hover:opacity-80' : 'opacity-0 group-hover:opacity-50'"
        @click.stop="emit('close', tab.id)"
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </span>

      <!-- Inline rename input or tab name -->
      <input
        v-if="editingTabId === tab.id"
        ref="inputRef"
        v-model="editingName"
        class="w-24 rounded border border-border bg-background px-1 py-0.5 text-center text-sm outline-none focus:border-primary"
        @blur="finishRename"
        @keydown.enter="finishRename"
        @keydown.escape="resetRename"
        @click.stop
      >
      <span v-else class="truncate px-5">{{ tab.name }}</span>
    </button>
  </div>
</template>
