<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

export type ToolbarAction = 'code' | 'controls' | 'menu'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
}>()

const emit = defineEmits<{
  action: [action: ToolbarAction]
  close: []
}>()

type ToolbarButton = {
  action: ToolbarAction
  label?: string
  title: string
  iconOnly?: boolean
}

const buttons: ToolbarButton[] = [
  { action: 'code', label: 'Code', title: 'View generated code' },
  { action: 'controls', label: 'Controls', title: 'Block settings' },
  { action: 'menu', title: 'More actions', iconOnly: true },
]

const toolbarRef = ref<HTMLElement | null>(null)
const adjustedX = ref(props.x)
const adjustedY = ref(props.y)

function handlePointerDown(event: Event) {
  if (!props.visible)
    return
  if (toolbarRef.value && !toolbarRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

watch(() => [props.visible, props.x, props.y], () => {
  if (!props.visible)
    return
  adjustedX.value = props.x
  adjustedY.value = props.y
  requestAnimationFrame(() => {
    if (!toolbarRef.value)
      return
    const rect = toolbarRef.value.getBoundingClientRect()
    const vw = window.innerWidth
    if (rect.right > vw)
      adjustedX.value = Math.max(4, vw - rect.width - 4)
    if (rect.left < 0)
      adjustedX.value = 4
    if (adjustedY.value < 4)
      adjustedY.value = 4
  })
}, { immediate: true })

onMounted(() => document.addEventListener('pointerdown', handlePointerDown, true))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handlePointerDown, true))
</script>

<template>
  <Teleport to="body">
    <Transition name="toolbar">
      <div
        v-if="visible"
        ref="toolbarRef"
        class="block-toolbar"
        data-no-deselect
        :style="{ left: `${adjustedX}px`, top: `${adjustedY}px`, transform: 'translate(-50%, -100%)' }"
        @pointerdown.stop
      >
        <template v-for="(btn, i) in buttons" :key="btn.action">
          <div v-if="i > 0" class="toolbar-sep" />
          <button
            class="toolbar-btn"
            :class="{ 'toolbar-btn--icon-only': btn.iconOnly }"
            :title="btn.title"
            @click.stop="emit('action', btn.action)"
          >
            <!-- Code icon -->
            <svg v-if="btn.action === 'code'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>

            <!-- Controls icon -->
            <svg v-else-if="btn.action === 'controls'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" />
              <line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" />
              <line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
              <line x1="1" x2="7" y1="14" y2="14" />
              <line x1="9" x2="15" y1="8" y2="8" />
              <line x1="17" x2="23" y1="16" y2="16" />
            </svg>

            <!-- Menu icon -->
            <svg v-else-if="btn.action === 'menu'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>

            <span v-if="btn.label">{{ btn.label }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.block-toolbar {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 3px 4px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--popover);
  color: var(--popover-foreground);
  box-shadow:
    0 4px 16px -4px rgba(0, 0, 0, 0.2),
    0 2px 6px -2px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 5px;
  border: none;
  background: none;
  color: var(--popover-foreground);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.1s;
}

.toolbar-btn:hover {
  background: var(--accent);
  color: var(--accent-foreground);
}

.toolbar-btn--active {
  color: var(--primary);
}

.toolbar-btn--icon-only {
  padding: 5px 6px;
}

.toolbar-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
  flex-shrink: 0;
}

.toolbar-enter-active {
  transition:
    opacity 0.12s ease-out,
    transform 0.12s ease-out;
}
.toolbar-leave-active {
  transition:
    opacity 0.08s ease-in,
    transform 0.08s ease-in;
}
.toolbar-enter-from,
.toolbar-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.97);
}
</style>
