<script setup lang="ts">
import type { NoteColor } from '@/composables/useWorkspaceNotes'
import { Trash2 } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NOTE_COLORS } from '@/composables/useWorkspaceNotes'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  activeColor: NoteColor
}>()

const emit = defineEmits<{
  setColor: [color: NoteColor]
  menu: []
  close: []
}>()

const colorEntries = Object.entries(NOTE_COLORS) as [NoteColor, typeof NOTE_COLORS[NoteColor]][]

const toolbarRef = ref<HTMLElement | null>(null)
const adjustedX = ref(props.x)
const adjustedY = ref(props.y)

function handlePointerDown(event: Event) {
  if (!props.visible) {
    return
  }
  const target = event.target as Node
  if (toolbarRef.value && !toolbarRef.value.contains(target)) {
    // Don't close if clicking on a sticky note — note selection will handle toolbar
    if ((target as Element).closest?.('.sticky-note')) {
      return
    }
    emit('close')
  }
}

watch(() => [props.visible, props.x, props.y], () => {
  if (!props.visible) {
    return
  }
  adjustedX.value = props.x
  adjustedY.value = props.y
  requestAnimationFrame(() => {
    if (!toolbarRef.value) {
      return
    }
    const rect = toolbarRef.value.getBoundingClientRect()
    const vw = window.innerWidth
    if (rect.right > vw) {
      adjustedX.value = Math.max(4, vw - rect.width - 4)
    }
    if (rect.left < 0) {
      adjustedX.value = 4
    }
    if (adjustedY.value < 4) {
      adjustedY.value = 4
    }
  })
}, { immediate: true })

onMounted(() => document.addEventListener('pointerdown', handlePointerDown, true))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handlePointerDown, true))
</script>

<template>
  <Teleport to="body">
    <Transition name="note-toolbar">
      <div
        v-if="visible"
        ref="toolbarRef"
        class="note-toolbar"
        data-no-deselect
        :style="{ left: `${adjustedX}px`, top: `${adjustedY}px`, transform: 'translate(-50%, -100%)' }"
        @pointerdown.stop
      >
        <div class="note-toolbar-colors">
          <button
            v-for="[name, colors] in colorEntries"
            :key="name"
            class="note-color-swatch"
            :class="{ 'note-color-active': name === activeColor, 'note-color-swatch--transparent': name === 'transparent' }"
            :title="name"
            :style="name !== 'transparent' ? { backgroundColor: colors.fill, borderColor: colors.border } : {}"
            @click.stop="emit('setColor', name)"
          />
        </div>
        <div class="note-toolbar-sep" />
        <button
          class="note-toolbar-btn note-toolbar-btn--delete"
          title="Delete note"
          @click.stop="emit('menu')"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.note-toolbar {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 4px 6px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--popover);
  color: var(--popover-foreground);
  box-shadow:
    0 4px 16px -4px rgba(0, 0, 0, 0.2),
    0 2px 6px -2px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  margin-top: -8px;
}

.note-toolbar-colors {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
}

.note-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition:
    transform 0.1s,
    border-color 0.1s;
  flex-shrink: 0;
}

.note-color-swatch:hover {
  transform: scale(1.15);
}

.note-color-swatch--transparent {
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0;
  border-color: #ccc !important;
}

.note-color-active {
  border-color: var(--foreground) !important;
  box-shadow:
    0 0 0 2px var(--background),
    0 0 0 4px var(--foreground);
}

.note-toolbar-sep {
  width: 1px;
  height: 18px;
  background: var(--border);
  flex-shrink: 0;
  margin: 0 4px;
}

.note-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: background-color 0.1s;
}

.note-toolbar-btn:hover {
  background: var(--accent);
  color: var(--accent-foreground);
}

.note-toolbar-btn--delete:hover {
  background: hsl(0 84% 60% / 0.15);
  color: hsl(0 84% 60%);
}

.note-toolbar-enter-active {
  transition:
    opacity 0.12s ease-out,
    transform 0.12s ease-out;
}
.note-toolbar-leave-active {
  transition:
    opacity 0.08s ease-in,
    transform 0.08s ease-in;
}
.note-toolbar-enter-from,
.note-toolbar-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.97);
}
</style>
